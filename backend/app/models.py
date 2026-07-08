from typing import Literal
from pydantic import BaseModel

class Alert(BaseModel):
    title: str
    description: str
    # 3-tier severity. Wording carries the info now — no numbers are shown
    # in the UI, so this drives both the color coding and the label text.
    severity: Literal["mild", "moderate", "severe"]


class Finding(BaseModel):
    """One test parameter from the report. Used to build the health card
    (normal vs abnormal counts) and to ground the chatbot's answers.

    `value` and `significance` are NOT displayed anywhere in the alerts or
    health card UI (per the 'no numbers' requirement) — they exist only so
    the chatbot can reference real numbers when the user asks about them
    directly in conversation, and so the premium preview can be genuinely
    personalized.
    """
    test_name: str
    value: str
    status: Literal["normal", "abnormal"]
    significance: str


class ReportAnalysis(BaseModel):
    cohort_risk: str
    alerts: list[Alert]
    findings: list[Finding]
    premium_preview: str
    starter_suggestions: list[str]
    disclaimer: str


# JSON Schema handed to Groq via response_format.
ANALYSIS_JSON_SCHEMA: dict = {
    "type": "object",
    "properties": {
        "cohort_risk_base": {
            "type": "string",
            "description": (
                "A specific, urgent risk statement based ONLY on the patient's own findings in this "
                "report (their actual abnormal values and what they mean). Do NOT include any external "
                "demographic, national, or population-level claim here — that goes in "
                "epi_claim_candidate instead."
            ),
        },
        "epi_claim_candidate": {
            "type": "string",
            "description": (
                "OPTIONAL. A single, precise, factually-checkable epidemiological or demographic claim "
                "you believe is true and relevant (e.g. 'Cardiovascular disease is the leading cause of "
                "death in India' or 'Type 2 diabetes prevalence is rising among Indian adults under 30'). "
                "This will be independently verified against live sources before ever being shown to the "
                "patient — if it cannot be verified, it will be silently discarded, so only propose a claim "
                "you believe a real source would confirm. Use an empty string if you have no such claim."
            ),
        },
        "alerts": {
            "type": "array",
            "description": (
                "1 to 3 critical alerts based on the most severe abnormal findings in the report. "
                "Descriptions must NEVER include the specific numeric value or unit — describe severity "
                "and clinical implication only, based on how far the value falls outside the report's own "
                "reference range."
            ),
            "items": {
                "type": "object",
                "properties": {
                    "title": {"type": "string"},
                    "description": {
                        "type": "string",
                        "description": "No numbers, no units. Qualitative severity + clinical implication only.",
                    },
                    "severity": {"type": "string", "enum": ["mild", "moderate", "severe"]},
                },
                "required": ["title", "description", "severity"],
                "additionalProperties": False,
            },
        },
        "findings": {
            "type": "array",
            "description": (
                "EVERY test parameter present in the report, not just the abnormal ones. "
                "Compare each value against the reference range printed in the report itself to "
                "determine status."
            ),
            "items": {
                "type": "object",
                "properties": {
                    "test_name": {"type": "string"},
                    "value": {"type": "string", "description": "The raw value + unit as it appears in the report."},
                    "status": {"type": "string", "enum": ["normal", "abnormal"]},
                    "significance": {
                        "type": "string",
                        "description": "One short clinical note. Used internally for chat grounding, not shown directly in the UI.",
                    },
                },
                "required": ["test_name", "value", "status", "significance"],
                "additionalProperties": False,
            },
        },
        "premium_preview": {
            "type": "string",
            "description": (
                "4 to 5 short lines, each a single actionable coaching tip written in a direct, "
                "personal coach voice (e.g. 'Cut refined sugar to under 25g/day \u2014 this directly "
                "targets your elevated triglycerides.'). EVERY line must be grounded in one of this "
                "patient's actual abnormal findings \u2014 no generic advice, no invented efficacy stats "
                "or percentages. Join the lines with \\n (one tip per line). This is shown blurred in "
                "the UI as an upgrade hook, so it must read as a real, specific plan, not a vague teaser."
            ),
        },
        "starter_suggestions": {
            "type": "array",
            "description": (
                "2 to 4 short, specific questions written from the PATIENT'S perspective, based on "
                "their actual abnormal findings (e.g. 'Why is my ALT elevated?'). Shown as tappable "
                "suggestion chips before the user has asked anything, so each must be answerable using "
                "only the findings already identified in this report."
            ),
            "items": {"type": "string"},
        },
        "disclaimer": {"type": "string"},
    },
    "required": [
        "cohort_risk_base",
        "epi_claim_candidate",
        "alerts",
        "findings",
        "premium_preview",
        "starter_suggestions",
        "disclaimer",
    ],
    "additionalProperties": False,
}

# --- Missing Models added back below! ---

class UploadResponse(BaseModel):
    session_id: str
    analysis: ReportAnalysis

class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str

class ChatRequest(BaseModel):
    session_id: str
    message: str
