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
        # Build summary using the correct keys from models.py
        analysis = getattr(session, "analysis", {}) or {}
        findings = analysis.get("findings", [])
        overall_assessment = analysis.get("overall_assessment", "")
        next_steps = analysis.get("recommended_next_steps", [])

        summary_lines = []
        if overall_assessment:
            summary_lines.append(f"Overall Assessment: {overall_assessment}")
            
        for f in findings[:10]:
            name = f.get("test_name", "")
            value = f.get("value", "")
            status = f.get("status", "")
            interpretation = f.get("significance", "")
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

        # Fix memory bug: properly read and store chat history
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

        # Save conversation to memory so bot remembers context next time
        if not got_content:
            fallback = "I'm sorry, I couldn't process that right now. Could you try rephrasing your question? 😊"
            session.messages.append({"role": "user", "content": user_message})
            session.messages.append({"role": "assistant", "content": fallback})
            yield fallback
        else:
            session.messages.append({"role": "user", "content": user_message})
            session.messages.append({"role": "assistant", "content": full_response})

    except groq.RateLimitError:
        yield "I'm getting too many requests right now. Please wait a moment and try again. 😊"
    except groq.AuthenticationError:
        yield "There's an issue with the API key. Please contact support."
    except Exception as e:
        yield f"Something went wrong on my end: {str(e)}. Please try again. 😊"
