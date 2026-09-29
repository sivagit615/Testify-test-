"""
Validation Engine
──────────────────
Enforces schema consistency and citation grounding
back to source requirements.
"""
from __future__ import annotations
import re


VALID_RISK_LEVELS = {"High", "Medium", "Low"}
VALID_TEST_TYPES = {"Positive", "Negative", "Boundary", "Edge", "Recovery"}


def validate_and_fix(data: dict) -> dict:
    """
    Master validation pass — ensures every field in the Gemini
    response conforms to the expected schema before Pydantic sees it.
    Returns the cleaned dict.
    """
    _fix_audit_findings(data)
    _fix_overall_risk(data)
    _fix_test_cases(data)
    _fix_conflicts(data)
    _fix_business_rules(data)
    _fix_coverage_audit(data)
    data.setdefault("summary", "UAT matrix generated successfully.")
    return data


# ── Internal fixers ───────────────────────────────────────────────────────────

def _fix_audit_findings(data: dict) -> None:
    findings = data.get("audit_findings", [])
    if not isinstance(findings, list):
        data["audit_findings"] = []
        return

    cleaned = []
    for f in findings:
        if not isinstance(f, dict):
            continue
        if f.get("risk_level") not in VALID_RISK_LEVELS:
            f["risk_level"] = "Medium"
        f.setdefault("issue", "Unspecified issue")
        f.setdefault("suggestion", "Review and clarify this requirement.")
        cleaned.append(f)
    data["audit_findings"] = cleaned


def _fix_overall_risk(data: dict) -> None:
    if data.get("overall_risk") not in VALID_RISK_LEVELS:
        data["overall_risk"] = "Medium"


def _fix_test_cases(data: dict) -> None:
    test_cases = data.get("test_cases", [])
    if not isinstance(test_cases, list):
        data["test_cases"] = []
        return

    cleaned = []
    for i, tc in enumerate(test_cases):
        if not isinstance(tc, dict):
            continue

        # test_id
        if not re.match(r"^TC_\d+$", str(tc.get("test_id", ""))):
            tc["test_id"] = f"TC_{i + 1:03d}"

        # test_type
        if tc.get("test_type") not in VALID_TEST_TYPES:
            tc["test_type"] = "Positive"

        # steps → list[str]
        steps = tc.get("steps", [])
        if isinstance(steps, str):
            parts = re.split(r"\.\s+|\n+|;\s+", steps)
            tc["steps"] = [p.strip() for p in parts if p.strip()]
        elif not isinstance(steps, list):
            tc["steps"] = [str(steps)]
        else:
            tc["steps"] = [str(s) for s in steps if s is not None]

        tc.setdefault("title", f"Test Case {i + 1}")
        tc.setdefault("preconditions", "Application is running and accessible.")
        tc.setdefault("expected_result", "The system behaves as specified.")
        tc.setdefault("source_citation", "")

        cleaned.append(tc)

    data["test_cases"] = cleaned


def _fix_conflicts(data: dict) -> None:
    conflicts = data.get("conflicts", [])
    if not isinstance(conflicts, list):
        data["conflicts"] = []
    else:
        data["conflicts"] = [str(c) for c in conflicts if c]


def _fix_business_rules(data: dict) -> None:
    rules = data.get("business_rules", [])
    if not isinstance(rules, list):
        data["business_rules"] = []
    else:
        data["business_rules"] = [str(r) for r in rules if r]


def _fix_coverage_audit(data: dict) -> None:
    audit = data.get("coverage_audit", [])
    if not isinstance(audit, list):
        data["coverage_audit"] = []
    else:
        data["coverage_audit"] = [str(a) for a in audit if a]


def ground_citations(test_cases: list[dict], prd_text: str) -> list[dict]:
    """
    Attempt to ground each test case's source_citation back to
    identifiable sections in the original PRD text.
    """
    # Build a simple section index from headings / numbered items
    sections: list[tuple[str, str]] = []

    for m in re.finditer(r"^#{1,3}\s+(.+)$", prd_text, re.M):
        sections.append(("heading", m.group(1).strip()))
    for m in re.finditer(r"^\s*\d+[\.\)]\s*(.+)$", prd_text, re.M):
        sections.append(("item", m.group(1).strip()))
    for m in re.finditer(r"^\s*[-•*]\s+(.+)$", prd_text, re.M):
        sections.append(("rule", m.group(1).strip()))

    for tc in test_cases:
        if tc.get("source_citation"):
            continue  # Gemini already provided one

        title_lower = tc.get("title", "").lower()
        best_match = ""
        best_score = 0

        for _, section_text in sections:
            sec_lower = section_text.lower()
            # Simple keyword overlap score
            title_words = set(title_lower.split())
            sec_words = set(sec_lower.split())
            overlap = len(title_words & sec_words)
            if overlap > best_score:
                best_score = overlap
                best_match = section_text

        if best_score >= 2:
            tc["source_citation"] = f"Derived from: \"{best_match[:80]}\""

    return test_cases
