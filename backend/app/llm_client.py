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
    try:
        # Build summary from structured analysis — NOT raw PDF text
        analysis = getattr(session, "analysis", {}) or {}
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
                "Suggested next steps: " + "; ".join(str(s) for s in next_steps[:3])
            )

        report_summary = (
            "\n".join(summary_lines)
            if summary_lines
            else "No report data available yet."
        )

        system = build_chat_system(report_summary)

        # Keep only last 8 messages to avoid token overflow
        history = getattr(session, "history", []) or []
        recent_history = history[-8:] if len(history) > 8 else history

        messages = (
            [{"role": "system", "content": system}]
            + recent_history
            + [{"role": "user", "content": user_message}]
        )

        # Use llama-3.3-70b — reliable streaming, no silent empty responses
        stream = _client.chat.completions.create(
                  model="meta-llama/llama-4-scout-17b-16e-instruct",
            messages=messages,
            stream=True,
            max_tokens=350,
            temperature=0.4,
        )

        got_content = False
        for chunk in stream:
            content = None
            try:
                content = chunk.choices[0].delta.content
            except (AttributeError, IndexError):
                continue
            if content is not None:
                got_content = True
                yield content

        # If model returned nothing at all, send a fallback
        if not got_content:
            yield "I'm sorry, I couldn't process that right now. Could you try rephrasing your question? 😊"

    except groq.RateLimitError:
        yield "I'm getting too many requests right now. Please wait a moment and try again. 😊"
    except groq.AuthenticationError:
        yield "There's an issue with the API key. Please contact support."
    except Exception as e:
        yield f"Something went wrong on my end: {str(e)}. Please try again. 😊"
