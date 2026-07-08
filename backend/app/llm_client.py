"""Groq integration: structured report analysis + a research-capable chat."""

import json
from collections.abc import Iterator

import groq

from .config import get_settings
from .models import ANALYSIS_JSON_SCHEMA
from .prompts import ANALYSIS_SYSTEM, build_chat_system
from .store import Session
from .verifier import verify_and_fix, strip_alert_numbers

_settings = get_settings()
_client = groq.Groq(api_key=_settings.groq_api_key or None)


def _call_groq_analysis(report_text: str, location_context: str, extra_instruction: str = "") -> dict:
    system = (
        ANALYSIS_SYSTEM
        + extra_instruction
        + "\n\nReturn a JSON object that conforms exactly to this JSON Schema "
        + "(same keys, same nesting):\n"
        + json.dumps(ANALYSIS_JSON_SCHEMA)
    )
    response = _client.chat.completions.create(
        model=_settings.analysis_model,
        temperature=0.2,
        max_tokens=4000,
        response_format={"type": "json_object"},
        messages=[
            {"role": "system", "content": system},
            {
                "role": "user",
                "content": (
                    f"{location_context}Analyze the following lab report and return the structured "
                    "JSON analysis.\n\n=== LAB REPORT ===\n" + report_text
                ),
            },
        ],
    )
    return json.loads(response.choices[0].message.content)


def analyze_report(report_text: str, location: str | None = None) -> dict:
    """Run a one-shot structured analysis, then apply both guardrails:
    1. cohort_risk fabrication check (existing)
    2. alert description number-stripping (new)
    """
    location_context = ""
    if location:
        location_context = (
            f"The user is located in {location}. Factor regional health trends "
            "for this demographic into your cohort risk.\n\n"
        )

    result = _call_groq_analysis(report_text, location_context)

    def _retry(flagged_numbers: list[str]) -> dict:
        correction_note = (
            "\n\nIMPORTANT CORRECTION: Your previous response included the "
            f"statistic(s) {flagged_numbers} in cohort_risk. These numbers do "
            "not appear anywhere in the source report and are fabricated. "
            "Regenerate cohort_risk WITHOUT inventing any percentage, "
            "multiplier (e.g. '2x'), or population-comparison number. You may "
            "only reference numbers that are explicitly present in the report "
            "text, or use qualitative urgency language with no invented stats."
        )
        return _call_groq_analysis(report_text, location_context, correction_note)

    result = verify_and_fix(result, report_text, _retry)
    result["alerts"] = strip_alert_numbers(result.get("alerts", []))
    return result


def stream_chat(session: Session, user_message: str) -> Iterator[str]:
    """Stream a chat response grounded in the structured analysis."""
    try:
        analysis = getattr(session, "analysis", {}) or {}
        findings = analysis.get("findings", [])
        cohort_risk = analysis.get("cohort_risk", "")

        summary_lines = []
        if cohort_risk:
            summary_lines.append(f"Overall Assessment: {cohort_risk}")

        for f in findings[:20]:
            name = f.get("test_name", "")
            value = f.get("value", "")
            status = f.get("status", "")
            interpretation = f.get("significance", "")
            if name:
                summary_lines.append(
                    f"- {name}: {value} -> {status}. {interpretation}"
                )

        report_summary = (
            "\n".join(summary_lines)
            if summary_lines
            else "No report data available yet."
        )

        system = build_chat_system(report_summary)

        history = getattr(session, "messages", []) or []
        recent_history = history[-8:] if len(history) > 8 else history

        messages = (
            [{"role": "system", "content": system}]
            + recent_history
            + [{"role": "user", "content": user_message}]
        )

        stream = _client.chat.completions.create(
            model="meta-llama/llama-4-scout-17b-16e-instruct",
            messages=messages,
            stream=True,
            max_tokens=450,
            temperature=0.4,
        )

        got_content = False
        full_response = ""
        for chunk in stream:
            content = None
            try:
                content = chunk.choices[0].delta.content
            except (AttributeError, IndexError):
                continue
            if content is not None:
                got_content = True
                full_response += content
                yield content

        if not got_content:
            fallback = "I'm sorry, I couldn't process that right now. Could you try rephrasing your question? 😊"
            session.messages.append({"role": "user", "content": user_message})
            session.messages.append({"role": "assistant", "content": fallback})
            yield fallback
        else:
            session.messages.append({"role": "user", "content": user_message})
            session.messages.append({"role": "assistant", "content": full_response})
            # Only count a successful exchange toward the free-question limit.
            session.chat_count += 1

    except groq.RateLimitError:
        yield "I'm getting too many requests right now. Please wait a moment and try again. 😊"
    except groq.AuthenticationError:
        yield "There's an issue with the API key. Please contact support."
    except Exception as e:
        yield f"Something went wrong on my end: {str(e)}. Please try again. 😊"
