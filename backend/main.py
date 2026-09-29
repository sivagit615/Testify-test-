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

# ─── Setup ────────────────────────────────────────────────────────────────────
load_dotenv()

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(message)s",
)
logger = logging.getLogger(__name__)

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
if not GEMINI_API_KEY:
    logger.warning("⚠  GEMINI_API_KEY is not set — API requests will fail.")

# Initialise the google-genai client (new stable SDK)
client = genai.Client(api_key=GEMINI_API_KEY) if GEMINI_API_KEY else None

# Prioritised model fallback chain — tries each in order on 404/503
MODELS = [
    "models/gemini-3.8-flash",
    "models/gemini-3.7-flash",
    "models/gemini-3.5-flash",
    "models/gemini-2.5-flash",
]
MODEL_ID = MODELS[0]  # used for logging / health endpoint

# ─── FastAPI App ──────────────────────────────────────────────────────────────
app = FastAPI(
    title="Testify API — TestMind AI",
    description="AI-powered UAT generation and PRD auditing via Google Gemini",
    version="2.1.0",
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
    test_type: str  # "Positive" | "Negative" | "Boundary"


class UATResponse(BaseModel):
    audit_findings: list[dict]
    overall_risk: str
    test_cases: list[TestCase]
    summary: str


# ─── Gemini Prompt ────────────────────────────────────────────────────────────
SYSTEM_INSTRUCTION = """You are Testify (TestMind AI), an elite AI QA Test Architect and Requirements Auditor with 15+ years of experience.
Your role is to audit PRDs for quality issues and generate comprehensive UAT test matrices.

CRITICAL: You MUST respond with ONLY a single, valid JSON object.
Do NOT include markdown code fences (```), prose, or any text outside the JSON object.
"""

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
      "test_type": "<exactly one of: Positive, Negative, Boundary>"
    }}
  ],
  "summary": "<2-3 sentence executive summary of the test coverage>"
}}

RULES:
- audit_findings: Flag vague language, missing error-handling specs, undefined business rules, conflicting requirements, and missing edge cases. Be specific.
- overall_risk: Derive from the severity of audit findings.
- test_cases: Generate AT LEAST 10 test cases. Include happy paths (Positive), failure paths (Negative), and edge/boundary conditions (Boundary). Number them TC_001, TC_002, etc.
- steps: MUST be a JSON array of strings, never a single string.
- test_type: MUST be EXACTLY "Positive", "Negative", or "Boundary" — case-sensitive, no other values.
- Respond with ONLY the JSON. No markdown. No prose. No code fences.

PRD / Requirements to analyse:
{prd_text}"""


# ─── JSON Extraction & Sanitisation ──────────────────────────────────────────
def extract_json(text: str) -> dict:
    """Robustly extract and parse JSON from the model's raw response text."""
    text = text.strip()

    # Strip markdown code fences if the model ignores the instruction
    text = re.sub(r"^```(?:json)?\s*\n?", "", text, flags=re.IGNORECASE | re.MULTILINE)
    text = re.sub(r"\n?```\s*$", "", text, flags=re.MULTILINE)
    text = text.strip()

    # Attempt 1 — direct parse
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass

    # Attempt 2 — find outermost { ... } block
    match = re.search(r"\{.*\}", text, re.DOTALL)
    if match:
        try:
            return json.loads(match.group())
        except json.JSONDecodeError:
            pass

    raise ValueError(
        "Model response did not contain parseable JSON. "
        f"Raw response (first 400 chars): {text[:400]}"
    )


def sanitise_response(data: dict) -> dict:
    """Enforce strict enum values and data-shape constraints before Pydantic."""
    VALID_RISK = {"High", "Medium", "Low"}
    VALID_TYPES = {"Positive", "Negative", "Boundary"}

    # --- audit_findings ---
    findings = data.get("audit_findings", [])
    if not isinstance(findings, list):
        data["audit_findings"] = []
    else:
        for f in findings:
            if not isinstance(f, dict):
                continue
            if f.get("risk_level") not in VALID_RISK:
                f["risk_level"] = "Medium"
            f.setdefault("issue", "Unspecified issue")
            f.setdefault("suggestion", "Review and clarify this requirement.")

    # --- overall_risk ---
    if data.get("overall_risk") not in VALID_RISK:
        data["overall_risk"] = "Medium"

    # --- test_cases ---
    test_cases = data.get("test_cases", [])
    if not isinstance(test_cases, list):
        data["test_cases"] = []
        test_cases = []

    for i, tc in enumerate(test_cases):
        if not isinstance(tc, dict):
            continue

        # Enforce TC_NNN format
        if not re.match(r"^TC_\d+$", str(tc.get("test_id", ""))):
            tc["test_id"] = f"TC_{i + 1:03d}"

        # Enforce test_type enum
        if tc.get("test_type") not in VALID_TYPES:
            tc["test_type"] = "Positive"

        # Ensure steps is always a list[str]
        steps = tc.get("steps", [])
        if isinstance(steps, str):
            parts = re.split(r"\.\s+|\n+|;\s+", steps)
            tc["steps"] = [p.strip() for p in parts if p.strip()]
        elif not isinstance(steps, list):
            tc["steps"] = [str(steps)]
        else:
            # Coerce each item to str, drop None values
            tc["steps"] = [str(s) for s in steps if s is not None]

        tc.setdefault("title", f"Test Case {i + 1}")
        tc.setdefault("preconditions", "Application is running and accessible.")
        tc.setdefault("expected_result", "The system behaves as specified.")

    # --- summary ---
    data.setdefault("summary", "UAT matrix generated successfully.")

    return data


# ─── Main Endpoint ────────────────────────────────────────────────────────────
@app.post("/api/generate-uat", response_model=UATResponse)
async def generate_uat(data: UATRequest) -> Any:
    if not GEMINI_API_KEY or not client:
        raise HTTPException(
            status_code=503,
            detail=(
                "GEMINI_API_KEY is not configured. "
                "Add it to backend/.env and restart the server. "
                "Get a free key at https://aistudio.google.com/app/apikey"
            ),
        )

    prompt = USER_PROMPT_TEMPLATE.format(prd_text=data.prd_text)
    logger.info(
        "-> Sending request to Gemini API (model=%s, chars=%d)", MODEL_ID, len(prompt)
    )

    # ── Call Gemini (retry + model fallback) ───────────────────────────────
    raw_text: str | None = None
    last_exc: Exception | None = None

    for model in MODELS:
        for attempt in range(1, 4):  # up to 3 attempts per model
            try:
                logger.info(
                    "-> Attempt %d/%d — model=%s", attempt, 3, model
                )
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
                logger.info(
                    "<- Gemini response received (model=%s, chars=%d)",
                    model,
                    len(raw_text),
                )
                break  # success — exit retry loop

            except Exception as exc:
                last_exc = exc
                err_str = str(exc)
                # 503 = overloaded → retry with backoff
                if "503" in err_str or "UNAVAILABLE" in err_str:
                    wait = 2 ** attempt  # 2s, 4s, 8s
                    logger.warning(
                        "Model %s overloaded (attempt %d/3). Retrying in %ds...",
                        model, attempt, wait,
                    )
                    time.sleep(wait)
                    continue
                # 404 = model retired/unavailable → skip to next model
                elif "404" in err_str or "NOT_FOUND" in err_str:
                    logger.warning(
                        "Model %s not available (404). Trying next model...", model
                    )
                    break
                # Any other error → fail fast
                else:
                    logger.error("Gemini API error: %s", exc)
                    raise HTTPException(
                        status_code=502,
                        detail=f"Gemini API error: {err_str}",
                    )
        if raw_text is not None:
            break  # got a response — exit model fallback loop

    if raw_text is None:
        detail = (
            f"All models unavailable. Last error: {last_exc}"
            if last_exc
            else "All models unavailable."
        )
        logger.error(detail)
        raise HTTPException(status_code=502, detail=detail)

    # ── Parse & Sanitise ─────────────────────────────────────────────────────
    try:
        parsed = extract_json(raw_text)
        parsed = sanitise_response(parsed)
    except (ValueError, KeyError, TypeError) as exc:
        logger.error("JSON parse/validation error: %s", exc)
        raise HTTPException(
            status_code=422,
            detail=f"Failed to parse structured response from Gemini: {str(exc)}",
        )

    # ── Final Pydantic validation ─────────────────────────────────────────────
    try:
        return UATResponse(**parsed)
    except Exception as exc:
        logger.error("Pydantic validation error: %s", exc)
        raise HTTPException(
            status_code=422,
            detail=f"Response schema validation failed: {str(exc)}",
        )


# ─── Utility Endpoints ────────────────────────────────────────────────────────
@app.get("/health")
async def health() -> dict:
    return {
        "status": "ok",
        "system": "TestMind AI backend operational",
        "model": MODEL_ID,
        "sdk": "google-genai 2.x",
        "api_key_configured": bool(GEMINI_API_KEY),
    }


@app.get("/")
async def root() -> dict:
    return {
        "message": "Testify API v2.1 — POST /api/generate-uat to generate a UAT matrix",
        "docs": "/docs",
        "health": "/health",
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
