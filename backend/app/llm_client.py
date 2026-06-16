"""Groq integration: structured report analysis + a research-capable chat."""

import json
from collections.abc import Iterator

import groq

from .config import get_settings
from .models import ANALYSIS_JSON_SCHEMA
from .prompts import ANALYSIS_SYSTEM, build_chat_system
from .store import Session

_settings = get_settings()
_client = groq.Groq(api_key=_settings.groq_api_key or None)


def analyze_report(report_text: str) -> dict:
    """Run a one-shot structured analysis of the extracted report text."""
    system = (
        ANALYSIS_SYSTEM
        + "\n\nReturn a JSON object that conforms exactly to this JSON Schema "
        + "(same keys, same nesting):\n"
        + json.dumps(ANALYSIS_JSON_SCHEMA)
    )
    response = _client.chat.completions.create(
        model=_settings.analysis_model,
        temperature=0.2,
        max_tokens=3000,
        response_format={"type": "json_object"},
        messages=[
            {"role": "system", "content": system},
            {
                "role": "user",
                "content": (
                    "Analyze the following lab report and return the structured "
                    "JSON analysis.\n\n=== LAB REPORT ===\n" + report_text
                ),
            },
        ],
    )
    return json.loads(response.choices[0].message.content)


def stream_chat(session: Session, user_message: str) -> Iterator[str]:
    """Stream a chat response grounded in the structured analysis."""

    # Build a concise summary from structured analysis — NOT raw PDF text
    analysis = session.analysis or {}
    findings = analysis.get("findings", [])
    overall_risk = analysis.get("overall_risk", "")
    next_steps = analysis.get("next_steps", [])

    summary_lines = []
    if overall_risk:
        summary_lines.append(f"Overall Risk: {overall_risk}")
    for f in findings[:10]:
        name = f.get("name", "")
        value = f.get("value", "")
        status = f.get("status", "")
        interpretation = f.get("interpretation", "")
        if name:
            summary_lines.append(
                f"- {name}: {value} → {status}. {interpretation}"
            )
    if next_steps:
        summary_lines.append(
            "Suggested next steps: " + "; ".join(next_steps[:3])
        )

    report_summary = (
        "\n".join(summary_lines) if summary_lines else "No report data available yet."
    )

    system = build_chat_system(report_summary)

    # Keep only last 8 messages to avoid token overflow
    recent_history = (
        session.history[-8:] if len(session.history) > 8 else session.history
    )

    messages = (
        [{"role": "system", "content": system}]
        + recent_history
        + [{"role": "user", "content": user_message}]
    )

    # Use llama-3.3-70b-versatile — reliable, fast, supports streaming well
    # groq/compound can silently return empty chunks
    stream = _client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=messages,
        stream=True,
        max_tokens=350,
        temperature=0.4,
    )

    for chunk in stream:
        try:
            delta = chunk.choices[0].delta.content
            if delta:
                yield delta
        except (AttributeError, IndexError):
            continue
