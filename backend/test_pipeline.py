import json
from ingestion_service import ingest
from requirement_engine import build_profile
from scenario_engine import enrich_test_cases, compute_stats
from coverage_engine import analyze as coverage_analyze
from risk_engine import prioritize as risk_prioritize
from validation_engine import validate_and_fix, ground_citations
from export_service import build_export

def run_test():
    print("Testing pipeline imports and execution...")
    
    prd_text = "The system must allow a user to log in with email and password. If the password is wrong 3 times, lock the account. A locked account can be unlocked by an admin."
    
    # Mocked Gemini parsed JSON
    mock_parsed = {
        "audit_findings": [
            {
                "issue": "No password complexity rules defined.",
                "risk_level": "Medium",
                "suggestion": "Define complexity rules for password."
            }
        ],
        "overall_risk": "Medium",
        "conflicts": [],
        "business_rules": ["Lock account after 3 wrong passwords"],
        "test_cases": [
            {
                "test_id": "TC_001",
                "title": "Successful Login",
                "preconditions": "User has valid account",
                "steps": ["Enter email", "Enter password", "Click Login"],
                "expected_result": "User is logged in",
                "test_type": "Positive",
                "source_citation": "allow user to log in"
            },
            {
                "test_id": "TC_002",
                "title": "Account Lockout",
                "preconditions": "User has valid account",
                "steps": ["Enter wrong password 3 times"],
                "expected_result": "Account is locked",
                "test_type": "Negative",
                "source_citation": "lock the account"
            }
        ],
        "coverage_audit": [],
        "summary": "Login functionality coverage."
    }

    # Stage 1: Ingestion
    print("Stage 1: Ingestion...")
    ingestion = ingest(prd_text)
    
    # Stage 4: Validation
    print("Stage 4: Validation...")
    parsed = validate_and_fix(mock_parsed)
    
    # Stage 5: Scenario
    print("Stage 5: Scenario...")
    parsed["test_cases"] = enrich_test_cases(parsed.get("test_cases", []))
    stats = compute_stats(parsed["test_cases"])
    
    # Stage 6: Requirement
    print("Stage 6: Requirement...")
    profile = build_profile(prd_text, parsed, ingestion.actors_hint)
    
    # Stage 7: Citation Grounding
    print("Stage 7: Citation Grounding...")
    parsed["test_cases"] = ground_citations(parsed["test_cases"], prd_text)
    
    # Stage 8: Coverage
    print("Stage 8: Coverage...")
    coverage = coverage_analyze(
        test_cases=parsed["test_cases"],
        audit_findings=parsed.get("audit_findings", []),
        business_rules=parsed.get("business_rules", []),
        workflows=profile.workflows,
        gemini_conflicts=parsed.get("conflicts"),
    )
    
    # Stage 9: Risk
    print("Stage 9: Risk...")
    risk = risk_prioritize(parsed.get("audit_findings", []))
    
    print("Pipeline Execution Successful!")
    print("Generated Coverage Score:", coverage.coverage_score)
    print("Generated Risk Score:", risk.risk_score)
    
    # Export
    print("Testing Export...")
    export = build_export(parsed, "PROJ")
    print("Export created successfully.")

if __name__ == "__main__":
    run_test()
