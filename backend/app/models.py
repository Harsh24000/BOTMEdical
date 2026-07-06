from typing import Literal
from pydantic import BaseModel

class Alert(BaseModel):
    title: str
    description: str
    severity: Literal["red", "orange"]

class ReportAnalysis(BaseModel):
    cohort_risk: str
    alerts: list[Alert]
    disclaimer: str

# JSON Schema handed to Claude/Groq via output_config.format.
ANALYSIS_JSON_SCHEMA: dict = {
    "type": "object",
    "properties": {
        "cohort_risk": {
            "type": "string",
            "description": "A cohort-level risk statement based on age, gender, or general population (e.g. '22-25 year old males are more susceptible to...').",
        },
        "alerts": {
            "type": "array",
            "description": "1 to 3 critical color-coded alerts based on the most severe findings in the report.",
            "items": {
                "type": "object",
                "properties": {
                    "title": {"type": "string"},
                    "description": {"type": "string"},
                    "severity": {"type": "string", "enum": ["red", "orange"]},
                },
                "required": ["title", "description", "severity"],
                "additionalProperties": False,
            },
        },
        "disclaimer": {"type": "string"},
    },
    "required": [
        "cohort_risk",
        "alerts",
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
