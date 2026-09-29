"""
Requirement Engine
──────────────────
Extracts semantic intent, actors, workflows, and business rules
from Gemini-generated output combined with ingestion metadata.
"""
from __future__ import annotations
import re
from dataclasses import dataclass, field


@dataclass
class RequirementProfile:
    actors: list[str] = field(default_factory=list)
    workflows: list[str] = field(default_factory=list)
    business_rules: list[str] = field(default_factory=list)
    semantic_intent: str = ""


def extract_actors(text: str, hints: list[str] | None = None) -> list[str]:
    """Extract unique actor/role names from the PRD text."""
    actors: set[str] = set()

    # From "As a <role>" patterns
    for m in re.finditer(r"As (?:a|an)\s+(.+?)(?:,|\s+I\s)", text, re.I):
        role = m.group(1).strip().title()
        if 2 < len(role) < 50:
            actors.add(role)

    # From explicit role mentions
    for m in re.finditer(
        r"\b(?:actor|role|persona|stakeholder)[:\s]+([A-Za-z\s]+?)(?:\.|,|\n)",
        text,
        re.I,
    ):
        role = m.group(1).strip().title()
        if 2 < len(role) < 50:
            actors.add(role)

    # Merge with ingestion hints
    if hints:
        for h in hints:
            actors.add(h.strip().title())

    return sorted(actors) or ["User"]


def extract_workflows(text: str) -> list[str]:
    """Identify high-level user workflows / flows described in the PRD."""
    workflows: list[str] = []

    # Numbered list items often describe workflows
    for m in re.finditer(r"^\s*\d+[\.\)]\s*(.+)$", text, re.M):
        line = m.group(1).strip()
        if 10 < len(line) < 300:
            workflows.append(line)

    # Section headings as workflow labels
    for m in re.finditer(r"^#{1,3}\s+(.+)$", text, re.M):
        heading = m.group(1).strip()
        if 3 < len(heading) < 100:
            workflows.append(heading)

    return workflows[:20]  # cap to avoid explosion


def extract_business_rules(text: str, gemini_rules: list[str] | None = None) -> list[str]:
    """Merge Gemini-extracted rules with regex-detected ones from PRD text."""
    rules: list[str] = list(gemini_rules or [])

    # Common rule patterns
    for m in re.finditer(
        r"(?:business rule|rule|constraint|policy|requirement)[:\s]*(.+?)(?:\.|$)",
        text,
        re.I | re.M,
    ):
        rule = m.group(1).strip()
        if 5 < len(rule) < 300 and rule not in rules:
            rules.append(rule)

    # Bullet-pointed rules under "Business Rules" heading
    br_section = re.search(
        r"Business\s+Rules?[:\s]*\n((?:\s*[-•*]\s*.+\n?)+)", text, re.I
    )
    if br_section:
        for m in re.finditer(r"[-•*]\s*(.+)", br_section.group(1)):
            rule = m.group(1).strip()
            if rule and rule not in rules:
                rules.append(rule)

    return rules


def build_profile(prd_text: str, gemini_data: dict, actor_hints: list[str] | None = None) -> RequirementProfile:
    """Build a complete RequirementProfile from PRD text and Gemini output."""
    actors = extract_actors(prd_text, actor_hints)
    workflows = extract_workflows(prd_text)
    business_rules = extract_business_rules(
        prd_text,
        gemini_data.get("business_rules", []),
    )

    # Derive semantic intent summary
    summary = gemini_data.get("summary", "")
    intent = (
        f"The PRD describes {len(workflows)} workflow(s) "
        f"involving {len(actors)} actor(s): {', '.join(actors)}. "
        f"{summary}"
    )

    return RequirementProfile(
        actors=actors,
        workflows=workflows,
        business_rules=business_rules,
        semantic_intent=intent.strip(),
    )
