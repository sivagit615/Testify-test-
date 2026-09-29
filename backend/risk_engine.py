"""
Risk Engine
───────────
Computes business risk prioritization based on
impact, exposure, and uncertainty metrics.
"""
from __future__ import annotations
from dataclasses import dataclass, field


RISK_WEIGHTS = {"High": 3, "Medium": 2, "Low": 1}


@dataclass
class RiskItem:
    issue: str
    risk_level: str
    suggestion: str
    impact_score: float = 0.0      # 1-10
    exposure_score: float = 0.0    # 1-10
    uncertainty_score: float = 0.0  # 1-10
    composite_score: float = 0.0   # weighted combination
    priority_rank: int = 0


@dataclass
class RiskReport:
    overall_risk: str = "Medium"
    risk_score: float = 0.0  # 0-100
    prioritized_findings: list[RiskItem] = field(default_factory=list)
    risk_summary: str = ""


def _estimate_impact(finding: dict) -> float:
    """Estimate business impact from the finding's risk level and content."""
    base = {"High": 8.0, "Medium": 5.0, "Low": 2.5}.get(
        finding.get("risk_level", "Medium"), 5.0
    )

    # Boost impact for security / data / compliance related issues
    issue_lower = (finding.get("issue", "") + finding.get("suggestion", "")).lower()
    critical_keywords = ["security", "auth", "password", "encrypt", "data loss",
                         "compliance", "gdpr", "pii", "injection", "breach"]
    boost = sum(0.5 for kw in critical_keywords if kw in issue_lower)

    return min(10.0, base + boost)


def _estimate_exposure(finding: dict) -> float:
    """Estimate how many users / flows are affected."""
    issue_lower = finding.get("issue", "").lower()

    # Higher exposure for user-facing, global, or core flow issues
    high_exposure = ["all user", "every", "global", "entire", "login",
                     "registration", "payment", "checkout", "api"]
    mid_exposure = ["some", "certain", "specific", "admin", "report"]

    for kw in high_exposure:
        if kw in issue_lower:
            return 8.0
    for kw in mid_exposure:
        if kw in issue_lower:
            return 5.0

    return 3.0


def _estimate_uncertainty(finding: dict) -> float:
    """Estimate ambiguity / uncertainty level from the finding."""
    issue_lower = finding.get("issue", "").lower()

    vague_keywords = ["unclear", "vague", "ambiguous", "undefined", "missing",
                      "not specified", "tbd", "unknown", "unspecified"]
    score = 3.0
    score += sum(1.0 for kw in vague_keywords if kw in issue_lower)

    return min(10.0, score)


def prioritize(audit_findings: list[dict]) -> RiskReport:
    """
    Score and rank all audit findings by composite risk,
    then compute an overall risk assessment.
    """
    if not audit_findings:
        return RiskReport(
            overall_risk="Low",
            risk_score=0.0,
            prioritized_findings=[],
            risk_summary="No audit findings to assess.",
        )

    items: list[RiskItem] = []

    for finding in audit_findings:
        if not isinstance(finding, dict):
            continue

        impact = _estimate_impact(finding)
        exposure = _estimate_exposure(finding)
        uncertainty = _estimate_uncertainty(finding)

        # Weighted composite: impact 50%, exposure 30%, uncertainty 20%
        composite = (impact * 0.5) + (exposure * 0.3) + (uncertainty * 0.2)

        items.append(RiskItem(
            issue=finding.get("issue", "Unknown issue"),
            risk_level=finding.get("risk_level", "Medium"),
            suggestion=finding.get("suggestion", ""),
            impact_score=round(impact, 1),
            exposure_score=round(exposure, 1),
            uncertainty_score=round(uncertainty, 1),
            composite_score=round(composite, 1),
        ))

    # Sort by composite score descending
    items.sort(key=lambda x: x.composite_score, reverse=True)

    # Assign priority ranks
    for rank, item in enumerate(items, 1):
        item.priority_rank = rank

    # Compute overall risk score (0-100)
    avg_composite = sum(i.composite_score for i in items) / len(items)
    risk_score = min(100.0, avg_composite * 10)

    # Derive overall risk level
    high_count = sum(1 for i in items if i.risk_level == "High")
    if high_count >= 3 or risk_score >= 70:
        overall_risk = "High"
    elif high_count >= 1 or risk_score >= 40:
        overall_risk = "Medium"
    else:
        overall_risk = "Low"

    # Summary
    summary = (
        f"Analyzed {len(items)} finding(s). "
        f"Top risk: \"{items[0].issue[:60]}\" (score: {items[0].composite_score}). "
        f"Overall risk score: {risk_score:.0f}/100 ({overall_risk})."
    )

    return RiskReport(
        overall_risk=overall_risk,
        risk_score=round(risk_score, 1),
        prioritized_findings=items,
        risk_summary=summary,
    )
