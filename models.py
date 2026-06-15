from typing import Literal

from pydantic import BaseModel

# ---- Structured analysis schema -------------------------------------------------

FindingStatus = Literal["normal", "low", "high", "borderline", "critical", "unknown"]
RiskSeverity = Literal["low", "moderate", "high"]


class Finding(BaseModel):
    test_name: str
    value: str
    reference_range: str
    status: FindingStatus
    significance: str


class PotentialRisk(BaseModel):
    risk: str
    explanation: str
    severity: RiskSeverity


class ReportAnalysis(BaseModel):
    patient_summary: str
    overall_assessment: str
    findings: list[Finding]
    potential_risks: list[PotentialRisk]
    recommended_next_steps: list[str]
    lifestyle_recommendations: list[str]
    questions_for_doctor: list[str]
    disclaimer: str


# JSON Schema handed to Claude via output_config.format. Kept in sync with
# ReportAnalysis above. All objects use additionalProperties: false and list
# every property as required (a requirement of the structured-output API).
ANALYSIS_JSON_SCHEMA: dict = {
    "type": "object",
    "properties": {
        "patient_summary": {
            "type": "string",
            "description": "1-2 sentence plain-language summary of who/what this report covers.",
        },
        "overall_assessment": {
            "type": "string",
            "description": "A short, calm overview of what the results indicate as a whole.",
        },
        "findings": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "test_name": {"type": "string"},
                    "value": {"type": "string"},
                    "reference_range": {"type": "string"},
                    "status": {
                        "type": "string",
                        "enum": ["normal", "low", "high", "borderline", "critical", "unknown"],
                    },
                    "significance": {
                        "type": "string",
                        "description": "Plain-language meaning of this specific result.",
                    },
                },
                "required": ["test_name", "value", "reference_range", "status", "significance"],
                "additionalProperties": False,
            },
        },
        "potential_risks": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "risk": {"type": "string"},
                    "explanation": {"type": "string"},
                    "severity": {"type": "string", "enum": ["low", "moderate", "high"]},
                },
                "required": ["risk", "explanation", "severity"],
                "additionalProperties": False,
            },
        },
        "recommended_next_steps": {
            "type": "array",
            "items": {"type": "string"},
            "description": "Concrete, actionable next steps (e.g. retest, see a specialist).",
        },
        "lifestyle_recommendations": {
            "type": "array",
            "items": {"type": "string"},
        },
        "questions_for_doctor": {
            "type": "array",
            "items": {"type": "string"},
            "description": "Useful questions the user could ask their physician.",
        },
        "disclaimer": {"type": "string"},
    },
    "required": [
        "patient_summary",
        "overall_assessment",
        "findings",
        "potential_risks",
        "recommended_next_steps",
        "lifestyle_recommendations",
        "questions_for_doctor",
        "disclaimer",
    ],
    "additionalProperties": False,
}


# ---- API request/response models ------------------------------------------------


class UploadResponse(BaseModel):
    session_id: str
    analysis: ReportAnalysis


class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str


class ChatRequest(BaseModel):
    session_id: str
    message: str
