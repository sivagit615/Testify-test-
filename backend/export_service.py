"""
Export Service
──────────────
Formats and exports test suites to CSV, JSON, and Jira-ready structures.
"""
from __future__ import annotations
import csv
import io
import json
from dataclasses import dataclass


@dataclass
class ExportPayload:
    csv_content: str
    json_content: str
    jira_tickets: list[dict]


def to_csv(test_cases: list[dict]) -> str:
    """Convert test cases to CSV string."""
    output = io.StringIO()
    writer = csv.writer(output, quoting=csv.QUOTE_ALL)

    headers = [
        "Test ID", "Title", "Test Type", "Preconditions",
        "Steps", "Expected Result", "Source Citation",
    ]
    writer.writerow(headers)

    for tc in test_cases:
        steps = tc.get("steps", [])
        steps_str = " | ".join(steps) if isinstance(steps, list) else str(steps)
        writer.writerow([
            tc.get("test_id", ""),
            tc.get("title", ""),
            tc.get("test_type", ""),
            tc.get("preconditions", ""),
            steps_str,
            tc.get("expected_result", ""),
            tc.get("source_citation", ""),
        ])

    return output.getvalue()


def to_json(full_response: dict) -> str:
    """Export the full structured response as formatted JSON."""
    return json.dumps(full_response, indent=2, ensure_ascii=False)


def to_jira_tickets(test_cases: list[dict], project_key: str = "TEST") -> list[dict]:
    """
    Convert test cases to Jira-ready ticket payloads
    compatible with the Jira REST API create-issue schema.
    """
    tickets: list[dict] = []

    for tc in test_cases:
        steps = tc.get("steps", [])
        steps_text = "\n".join(
            f"# {s}" for s in (steps if isinstance(steps, list) else [str(steps)])
        )

        ticket = {
            "fields": {
                "project": {"key": project_key},
                "summary": f"[{tc.get('test_id', 'TC')}] {tc.get('title', 'Test Case')}",
                "issuetype": {"name": "Test"},
                "description": (
                    f"*Test Type:* {tc.get('test_type', 'Positive')}\n\n"
                    f"*Preconditions:*\n{tc.get('preconditions', 'N/A')}\n\n"
                    f"*Steps:*\n{steps_text}\n\n"
                    f"*Expected Result:*\n{tc.get('expected_result', 'N/A')}\n\n"
                    f"*Source:* {tc.get('source_citation', 'N/A')}"
                ),
                "labels": [
                    "testify-generated",
                    tc.get("test_type", "Positive").lower(),
                ],
            }
        }
        tickets.append(ticket)

    return tickets


def build_export(full_response: dict, project_key: str = "TEST") -> ExportPayload:
    """Build all export formats from the full API response."""
    test_cases = full_response.get("test_cases", [])

    return ExportPayload(
        csv_content=to_csv(test_cases),
        json_content=to_json(full_response),
        jira_tickets=to_jira_tickets(test_cases, project_key),
    )
