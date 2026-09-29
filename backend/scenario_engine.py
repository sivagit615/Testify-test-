"""
Scenario Engine
────────────────
Validates, enriches, and normalises test cases across the full
scenario family: Positive, Negative, Boundary, Edge, Recovery.
"""
from __future__ import annotations
import re
from dataclasses import dataclass


VALID_TYPES = {"Positive", "Negative", "Boundary", "Edge", "Recovery"}


@dataclass
class ScenarioStats:
    total: int = 0
    by_type: dict[str, int] | None = None
    missing_types: list[str] | None = None


def normalise_test_type(raw_type: str) -> str:
    """Map a raw test_type string to the nearest valid enum value."""
    if not raw_type:
        return "Positive"

    cleaned = raw_type.strip().title()

    # Direct match
    if cleaned in VALID_TYPES:
        return cleaned

    # Fuzzy mapping
    mapping = {
        "Happy": "Positive",
        "Happy Path": "Positive",
        "Success": "Positive",
        "Valid": "Positive",
        "Fail": "Negative",
        "Failure": "Negative",
        "Error": "Negative",
        "Invalid": "Negative",
        "Edge Case": "Edge",
        "Corner": "Edge",
        "Limit": "Boundary",
        "Min": "Boundary",
        "Max": "Boundary",
        "Recover": "Recovery",
        "Rollback": "Recovery",
        "Retry": "Recovery",
        "Fallback": "Recovery",
    }

    for key, val in mapping.items():
        if key.lower() in cleaned.lower():
            return val

    return "Positive"


def normalise_steps(steps) -> list[str]:
    """Ensure steps is a list[str]."""
    if isinstance(steps, str):
        parts = re.split(r"\.\s+|\n+|;\s+", steps)
        return [p.strip() for p in parts if p.strip()]
    if not isinstance(steps, list):
        return [str(steps)]
    return [str(s) for s in steps if s is not None]


def enrich_test_cases(test_cases: list[dict]) -> list[dict]:
    """
    Normalise and enrich a list of test case dicts:
    - Fix test_id format
    - Normalise test_type to valid enum
    - Ensure steps are list[str]
    - Fill missing defaults
    """
    enriched = []

    for i, tc in enumerate(test_cases):
        if not isinstance(tc, dict):
            continue

        # Enforce TC_NNN id format
        raw_id = str(tc.get("test_id", ""))
        if not re.match(r"^TC_\d+$", raw_id):
            tc["test_id"] = f"TC_{i + 1:03d}"

        # Normalise type
        tc["test_type"] = normalise_test_type(tc.get("test_type", ""))

        # Normalise steps
        tc["steps"] = normalise_steps(tc.get("steps", []))

        # Defaults
        tc.setdefault("title", f"Test Case {i + 1}")
        tc.setdefault("preconditions", "Application is running and accessible.")
        tc.setdefault("expected_result", "The system behaves as specified.")
        tc.setdefault("source_citation", "")

        enriched.append(tc)

    return enriched


def compute_stats(test_cases: list[dict]) -> ScenarioStats:
    """Compute scenario family statistics."""
    counts: dict[str, int] = {t: 0 for t in VALID_TYPES}
    for tc in test_cases:
        t = tc.get("test_type", "Positive")
        if t in counts:
            counts[t] += 1

    missing = [t for t, c in counts.items() if c == 0]

    return ScenarioStats(
        total=len(test_cases),
        by_type=counts,
        missing_types=missing,
    )
