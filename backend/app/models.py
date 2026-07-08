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
    disclaimer: str


# JSON Schema handed to Groq via response_format.
ANALYSIS_JSON_SCHEMA: dict = {
    "type": "object",
    "properties": {
        "cohort_risk": {
            "type": "string",
            "description": "A cohort-level risk statement based on age, gender, or general population (e.g. '22-25 year old males are more susceptible to...').",
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
                "A genuine, specific 2-4 sentence preview of personalized diet/lifestyle coaching "
                "based on the patient's actual abnormal findings (e.g. concrete dietary or activity "
                "guidance tied to their real results). This is shown blurred in the UI as an upgrade hook, "
                "so it must be real, substantive content — not a generic teaser sentence."
            ),
        },
        "disclaimer": {"type": "string"},
    },
    "required": [
        "cohort_risk",
        "alerts",
        "findings",
        "premium_preview",
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
