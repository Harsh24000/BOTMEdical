"""Groq integration: structured report analysis + a research-capable chat.

Uses the Groq SDK (OpenAI-compatible). The analysis call uses Groq JSON mode to
return structured data; the chat uses the `groq/compound` model, which has
built-in web search so the assistant can do real medical research and cite
sources.
"""

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
        max_tokens=8000,
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


def summarize_analysis_for_context(analysis: dict) -> str:
    """Compact, human-readable rendering of the analysis to seed chat context."""
    lines: list[str] = [f"Overall: {analysis.get('overall_assessment', '')}"]

    findings = analysis.get("findings", [])
    notable = [f for f in findings if f.get("status") not in ("normal", "unknown")]
    if notable:
        lines.append("Notable findings:")
        for f in notable:
            lines.append(
                f"- {f['test_name']}: {f['value']} (ref {f['reference_range']}) "
                f"[{f['status']}] — {f['significance']}"
            )

    risks = analysis.get("potential_risks", [])
    if risks:
        lines.append("Potential risks:")
        for r in risks:
            lines.append(f"- [{r['severity']}] {r['risk']}: {r['explanation']}")

    return "\n".join(lines)


def stream_chat(session: Session, user_message: str) -> Iterator[str]:
    """Stream a chat reply as plain text chunks.

    Appends the user message and the assistant reply to the session history.
    The compound model performs any web searches server-side and streams the
    final answer text.
    """
    session.messages.append({"role": "user", "content": user_message})

    system_prompt = build_chat_system(
        session.report_text,
        summarize_analysis_for_context(session.analysis),
    )

    # OpenAI-style message list: system prompt first, then the conversation.
    messages = [{"role": "system", "content": system_prompt}, *session.messages]

    parts: list[str] = []
    stream = _client.chat.completions.create(
        model=_settings.chat_model,
        temperature=0.3,
        max_tokens=4000,
        stream=True,
        messages=messages,
    )
    for chunk in stream:
        if not chunk.choices:
            continue
        delta = chunk.choices[0].delta.content
        if delta:
            parts.append(delta)
            yield delta

    session.messages.append({"role": "assistant", "content": "".join(parts)})
