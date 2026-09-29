"""
Coverage Engine
────────────────
Performs coverage-gap detection, flags conflicting rules,
and builds a coverage audit matrix.
"""
from __future__ import annotations
from dataclasses import dataclass, field


@dataclass
class CoverageReport:
    gaps: list[str] = field(default_factory=list)
    conflicts: list[str] = field(default_factory=list)
    coverage_audit: list[str] = field(default_factory=list)
    coverage_score: float = 0.0  # 0..100


def detect_gaps(
    test_cases: list[dict],
    business_rules: list[str],
    workflows: list[str],
) -> list[str]:
    """
    Detect coverage gaps by cross-referencing test cases against
    extracted business rules and workflows.
    """
    gaps: list[str] = []

    # Concatenate all test case text for keyword matching
    tc_text = " ".join(
        f"{tc.get('title', '')} {tc.get('expected_result', '')} "
        f"{' '.join(tc.get('steps', []))}"
        for tc in test_cases
    ).lower()

    # Check each business rule for coverage
    for rule in business_rules:
        # Extract keywords (words > 3 chars)
        keywords = [w.lower() for w in rule.split() if len(w) > 3]
        # If less than 30% of keywords appear in test cases, flag gap
        if keywords:
            hits = sum(1 for kw in keywords if kw in tc_text)
            ratio = hits / len(keywords)
            if ratio < 0.3:
                gaps.append(f"Business rule may lack test coverage: \"{rule}\"")

    # Check workflows
    for wf in workflows[:15]:
        keywords = [w.lower() for w in wf.split() if len(w) > 3]
        if keywords:
            hits = sum(1 for kw in keywords if kw in tc_text)
            ratio = hits / len(keywords)
            if ratio < 0.25:
                gaps.append(f"Workflow may lack test coverage: \"{wf[:80]}\"")

    # Check for missing scenario families
    type_counts = {}
    for tc in test_cases:
        t = tc.get("test_type", "Positive")
        type_counts[t] = type_counts.get(t, 0) + 1

    for required_type in ["Positive", "Negative", "Boundary"]:
        if type_counts.get(required_type, 0) == 0:
            gaps.append(f"No {required_type} test cases generated — critical coverage gap")

    return gaps


def detect_conflicts(
    audit_findings: list[dict],
    gemini_conflicts: list[str] | None = None,
) -> list[str]:
    """
    Merge Gemini-detected conflicts with heuristic-detected ones.
    """
    conflicts: list[str] = list(gemini_conflicts or [])

    # Flag findings that directly contradict each other
    high_issues = [
        f.get("issue", "")
        for f in audit_findings
        if f.get("risk_level") == "High"
    ]

    # Simple heuristic: if two high-risk findings mention the same entity
    # in opposite contexts, flag potential conflict
    for i, a in enumerate(high_issues):
        for b in high_issues[i + 1:]:
            a_words = set(a.lower().split())
            b_words = set(b.lower().split())
            overlap = a_words & b_words
            # If >40% word overlap between two different high-risk issues
            min_len = min(len(a_words), len(b_words))
            if min_len > 0 and len(overlap) / min_len > 0.4:
                conflicts.append(
                    f"Potential conflict between: \"{a[:60]}...\" and \"{b[:60]}...\""
                )

    return conflicts


def build_coverage_audit(
    test_cases: list[dict],
    gaps: list[str],
    conflicts: list[str],
) -> list[str]:
    """
    Build human-readable coverage audit notes for QA review.
    """
    audit: list[str] = []

    total = len(test_cases)
    if total == 0:
        audit.append("CRITICAL: No test cases were generated. Manual review required.")
        return audit

    if total < 5:
        audit.append(
            f"WARNING: Only {total} test cases generated. "
            "Consider expanding coverage for production readiness."
        )

    if gaps:
        audit.append(f"Found {len(gaps)} coverage gap(s) requiring human QA review.")
        for g in gaps[:5]:
            audit.append(f"  • {g}")

    if conflicts:
        audit.append(f"Found {len(conflicts)} potential conflict(s) in requirements.")
        for c in conflicts[:5]:
            audit.append(f"  • {c}")

    # Type distribution check
    type_counts = {}
    for tc in test_cases:
        t = tc.get("test_type", "Positive")
        type_counts[t] = type_counts.get(t, 0) + 1

    positive_pct = (type_counts.get("Positive", 0) / total) * 100
    if positive_pct > 70:
        audit.append(
            f"NOTE: {positive_pct:.0f}% of tests are Positive. "
            "Consider adding more Negative/Boundary/Edge cases."
        )

    if not audit:
        audit.append("Coverage analysis complete. No critical gaps detected.")

    return audit


def compute_coverage_score(test_cases: list[dict], gaps: list[str]) -> float:
    """Compute a 0–100 coverage score."""
    if not test_cases:
        return 0.0

    # Base score from test count (max 50 points for 10+ tests)
    count_score = min(len(test_cases) / 10, 1.0) * 50

    # Type diversity score (max 30 points)
    types_present = len({tc.get("test_type") for tc in test_cases})
    diversity_score = min(types_present / 5, 1.0) * 30

    # Gap penalty (max -20 points)
    gap_penalty = min(len(gaps) * 4, 20)

    return max(0, min(100, count_score + diversity_score - gap_penalty))


def analyze(
    test_cases: list[dict],
    audit_findings: list[dict],
    business_rules: list[str],
    workflows: list[str],
    gemini_conflicts: list[str] | None = None,
) -> CoverageReport:
    """Run the full coverage analysis pipeline."""
    gaps = detect_gaps(test_cases, business_rules, workflows)
    conflicts = detect_conflicts(audit_findings, gemini_conflicts)
    audit = build_coverage_audit(test_cases, gaps, conflicts)
    score = compute_coverage_score(test_cases, gaps)

    return CoverageReport(
        gaps=gaps,
        conflicts=conflicts,
        coverage_audit=audit,
        coverage_score=round(score, 1),
    )
