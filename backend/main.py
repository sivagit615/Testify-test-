import os
import time
import re
import json
import logging
from typing import Any

import google.genai as genai
from google.genai import types as genai_types
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, field_validator

# ─── Pipeline Imports ─────────────────────────────────────────────────────────
from ingestion_service import ingest
from requirement_engine import build_profile
from scenario_engine import enrich_test_cases, compute_stats
from coverage_engine import analyze as coverage_analyze
from risk_engine import prioritize as risk_prioritize
from validation_engine import validate_and_fix, ground_citations
from export_service import build_export

# ─── Setup ────────────────────────────────────────────────────────────────────
load_dotenv()

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(message)s",
)
logger = logging.getLogger(__name__)

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
if not GEMINI_API_KEY:
    logger.warning("GEMINI_API_KEY is not set - API requests will fail.")

client = genai.Client(api_key=GEMINI_API_KEY) if GEMINI_API_KEY else None

# Prioritised model fallback chain
MODELS = [
    "models/gemini-3.8-flash",
    "models/gemini-3.7-flash",
    "models/gemini-3.5-flash",
    "models/gemini-2.5-flash",
]
MODEL_ID = MODELS[0]

# ─── FastAPI App ──────────────────────────────────────────────────────────────
app = FastAPI(
    title="Testify API - TestMind AI",
    description="Enterprise AI-powered UAT generation and PRD auditing",
    version="3.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Pydantic Schemas ─────────────────────────────────────────────────────────
class UATRequest(BaseModel):
    prd_text: str = Field(..., min_length=10, max_length=10_000)

    @field_validator("prd_text")
    @classmethod
    def strip_whitespace(cls, v: str) -> str:
        return v.strip()


class TestCase(BaseModel):
    test_id: str
    title: str
    preconditions: str
    steps: list[str]
    expected_result: str
    test_type: str
    source_citation: str = ""


class RiskItemOut(BaseModel):
    issue: str
    risk_level: str
    suggestion: str
    impact_score: float = 0.0
    exposure_score: float = 0.0
    uncertainty_score: float = 0.0
    composite_score: float = 0.0
    priority_rank: int = 0


class UATResponse(BaseModel):
    audit_findings: list[dict]
    overall_risk: str
    risk_score: float = 0.0
    risk_summary: str = ""
    prioritized_findings: list[RiskItemOut] = []
    conflicts: list[str] = []
    business_rules: list[str] = []
    test_cases: list[TestCase]
    coverage_audit: list[str] = []
    coverage_score: float = 0.0
    summary: str


# ─── Gemini Prompt ────────────────────────────────────────────────────────────
SYSTEM_INSTRUCTION = """You are Testify (TestMind AI), an elite AI QA Test Architect and Requirements Auditor with 15+ years of enterprise experience.
Your role is to audit PRDs for quality issues and generate comprehensive UAT test matrices.

CRITICAL: You MUST respond with ONLY a single, valid JSON object.
Do NOT include markdown code fences, prose, or any text outside the JSON object."""

USER_PROMPT_TEMPLATE = """Analyse the following PRD/requirements and respond with a single JSON object matching this EXACT schema:

{{
  "audit_findings": [
    {{
      "issue": "<brief description of the specific problem>",
      "risk_level": "<exactly one of: High, Medium, Low>",
      "suggestion": "<concrete, actionable recommendation>"
    }}
  ],
  "overall_risk": "<exactly one of: High, Medium, Low>",
  "conflicts": ["<contradictory statement detected across the PRD>"],
  "business_rules": ["<explicit constraint extracted from the PRD>"],
  "test_cases": [
    {{
      "test_id": "TC_001",
      "title": "<concise test case title>",
      "preconditions": "<what must be true before running this test>",
      "steps": [
        "Step 1: <user action>",
        "Step 2: <user action>"
      ],
      "expected_result": "<clear, measurable outcome>",
      "test_type": "<exactly one of: Positive, Negative, Boundary, Edge, Recovery>",
      "source_citation": "<which PRD section/rule this test validates>"
    }}
  ],
  "coverage_audit": ["<notes requiring human QA review>"],
  "summary": "<2-3 sentence executive summary of the test coverage>"
}}

RULES:
- audit_findings: Flag vague language, missing error-handling specs, undefined business rules, conflicting requirements, missing edge cases. Be specific.
- conflicts: Detect contradictions across different parts of the source document.
- business_rules: Extract every explicit constraint, threshold, limit, or rule stated in the PRD.
- overall_risk: Derive from the severity of audit findings.
- test_cases: Generate AT LEAST 10 test cases. Include: Positive (happy paths), Negative (failure paths), Boundary (limits), Edge (corner cases), and Recovery (error recovery/rollback). Number them TC_001, TC_002, etc.
- steps: MUST be a JSON array of strings, never a single string.
- test_type: MUST be EXACTLY one of "Positive", "Negative", "Boundary", "Edge", "Recovery" - case-sensitive.
- source_citation: Reference the specific PRD section, user story, or business rule this test validates.
- coverage_audit: Note any areas that need human QA review or have insufficient test coverage.
- Respond with ONLY the JSON. No markdown. No prose. No code fences.

PRD / Requirements to analyse:
{prd_text}"""


# ─── JSON Extraction ─────────────────────────────────────────────────────────
def extract_json(text: str) -> dict:
    """Robustly extract and parse JSON from model response."""
    text = text.strip()
    text = re.sub(r"^```(?:json)?\s*\n?", "", text, flags=re.IGNORECASE | re.MULTILINE)
    text = re.sub(r"\n?```\s*$", "", text, flags=re.MULTILINE)
    text = text.strip()

    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass

    match = re.search(r"\{.*\}", text, re.DOTALL)
    if match:
        try:
            return json.loads(match.group())
        except json.JSONDecodeError:
            pass

    raise ValueError(
        "Model response did not contain parseable JSON. "
        f"Raw (first 400 chars): {text[:400]}"
    )


# ─── Main Endpoint ────────────────────────────────────────────────────────────
@app.post("/api/generate-uat", response_model=UATResponse)
async def generate_uat(data: UATRequest) -> Any:
    if not GEMINI_API_KEY or not client:
        raise HTTPException(
            status_code=503,
            detail="GEMINI_API_KEY is not configured. Add it to backend/.env and restart.",
        )

    # ── Stage 1: Ingestion ────────────────────────────────────────────────
    ingestion = ingest(data.prd_text)
    logger.info(
        "Ingestion: format=%s, chunks=%d, actors=%s",
        ingestion.format_detected, len(ingestion.chunks), ingestion.actors_hint,
    )

    prompt = USER_PROMPT_TEMPLATE.format(prd_text=data.prd_text)
    logger.info("Sending request to Gemini API (chars=%d)", len(prompt))

    # ── Stage 2: Gemini Call (retry + model fallback) ─────────────────────
    raw_text: str | None = None
    last_exc: Exception | None = None

    for model in MODELS:
        for attempt in range(1, 4):
            try:
                logger.info("Attempt %d/3 - model=%s", attempt, model)
                response = client.models.generate_content(
                    model=model,
                    contents=prompt,
                    config=genai_types.GenerateContentConfig(
                        system_instruction=SYSTEM_INSTRUCTION,
                        temperature=0.25,
                        max_output_tokens=8192,
                    ),
                )
                raw_text = response.text
                logger.info("Gemini response received (model=%s, chars=%d)", model, len(raw_text))
                break
            except Exception as exc:
                last_exc = exc
                err_str = str(exc)
                if "503" in err_str or "UNAVAILABLE" in err_str:
                    wait = 2 ** attempt
                    logger.warning("Model %s overloaded (attempt %d/3). Retrying in %ds...", model, attempt, wait)
                    time.sleep(wait)
                    continue
                elif "404" in err_str or "NOT_FOUND" in err_str:
                    logger.warning("Model %s not available (404). Trying next...", model)
                    break
                else:
                    logger.error("Gemini API error: %s", exc)
                    raise HTTPException(status_code=502, detail=f"Gemini API error: {err_str}")
        if raw_text is not None:
            break

    if raw_text is None:
        detail = f"All models unavailable. Last error: {last_exc}" if last_exc else "All models unavailable."
        raise HTTPException(status_code=502, detail=detail)

    # ── Stage 3: Parse JSON ───────────────────────────────────────────────
    try:
        parsed = extract_json(raw_text)
    except (ValueError, KeyError, TypeError) as exc:
        logger.error("JSON parse error: %s", exc)
        raise HTTPException(status_code=422, detail=f"Failed to parse Gemini response: {str(exc)}")

    # ── Stage 4: Validation Engine ────────────────────────────────────────
    parsed = validate_and_fix(parsed)

    # ── Stage 5: Scenario Engine ──────────────────────────────────────────
    parsed["test_cases"] = enrich_test_cases(parsed.get("test_cases", []))
    scenario_stats = compute_stats(parsed["test_cases"])
    logger.info("Scenarios: total=%d, by_type=%s", scenario_stats.total, scenario_stats.by_type)

    # ── Stage 6: Requirement Engine ───────────────────────────────────────
    profile = build_profile(data.prd_text, parsed, ingestion.actors_hint)
    # Merge extracted business rules
    existing_rules = parsed.get("business_rules", [])
    for rule in profile.business_rules:
        if rule not in existing_rules:
            existing_rules.append(rule)
    parsed["business_rules"] = existing_rules

    # ── Stage 7: Citation Grounding ───────────────────────────────────────
    parsed["test_cases"] = ground_citations(parsed["test_cases"], data.prd_text)

    # ── Stage 8: Coverage Engine ──────────────────────────────────────────
    coverage = coverage_analyze(
        test_cases=parsed["test_cases"],
        audit_findings=parsed.get("audit_findings", []),
        business_rules=parsed.get("business_rules", []),
        workflows=profile.workflows,
        gemini_conflicts=parsed.get("conflicts"),
    )
    # Merge coverage results
    existing_conflicts = parsed.get("conflicts", [])
    for c in coverage.conflicts:
        if c not in existing_conflicts:
            existing_conflicts.append(c)
    parsed["conflicts"] = existing_conflicts

    existing_audit = parsed.get("coverage_audit", [])
    for a in coverage.coverage_audit:
        if a not in existing_audit:
            existing_audit.append(a)
    parsed["coverage_audit"] = existing_audit
    parsed["coverage_score"] = coverage.coverage_score

    # ── Stage 9: Risk Engine ──────────────────────────────────────────────
    risk = risk_prioritize(parsed.get("audit_findings", []))
    parsed["overall_risk"] = risk.overall_risk
    parsed["risk_score"] = risk.risk_score
    parsed["risk_summary"] = risk.risk_summary
    parsed["prioritized_findings"] = [
        {
            "issue": item.issue,
            "risk_level": item.risk_level,
            "suggestion": item.suggestion,
            "impact_score": item.impact_score,
            "exposure_score": item.exposure_score,
            "uncertainty_score": item.uncertainty_score,
            "composite_score": item.composite_score,
            "priority_rank": item.priority_rank,
        }
        for item in risk.prioritized_findings
    ]

    # ── Stage 10: Final Pydantic Validation ───────────────────────────────
    try:
        return UATResponse(**parsed)
    except Exception as exc:
        logger.error("Pydantic validation error: %s", exc)
        raise HTTPException(status_code=422, detail=f"Response schema validation failed: {str(exc)}")


# ─── Export Endpoint ──────────────────────────────────────────────────────────
class ExportRequest(BaseModel):
    response_data: dict
    project_key: str = "TEST"

@app.post("/api/export")
async def export_data(req: ExportRequest):
    """Generate CSV, JSON, and Jira payloads from a previous response."""
    try:
        payload = build_export(req.response_data, req.project_key)
        return {
            "csv": payload.csv_content,
            "json": payload.json_content,
            "jira_tickets": payload.jira_tickets,
        }
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Export error: {str(exc)}")


# ─── Utility Endpoints ────────────────────────────────────────────────────────
@app.get("/health")
async def health() -> dict:
    return {
        "status": "ok",
        "system": "TestMind AI backend operational",
        "model": MODEL_ID,
        "sdk": "google-genai 2.x",
        "api_key_configured": bool(GEMINI_API_KEY),
        "pipeline": [
            "ingestion", "gemini", "validation", "scenario",
            "requirement", "citation", "coverage", "risk",
        ],
    }


@app.get("/")
async def root() -> dict:
    return {
        "message": "Testify API v3.0 - Enterprise TestMind AI Pipeline",
        "docs": "/docs",
        "health": "/health",
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
