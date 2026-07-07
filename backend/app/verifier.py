"""
Guardrail layer that catches fabricated statistics in the AI-generated
cohort_risk field before they reach the user.

Design: the pipeline has no real epidemiological database. The ONLY numbers
that are legitimately verifiable are ones that already appear in the
source report text (patient's own values / reference ranges). Any
percentage, multiplier ("2.3x"), or population-comparison number in
cohort_risk that does NOT trace back to the report text is, by
construction, invented by the model — not looked up, not calculated.

This module is deliberately dumb and deterministic where possible.
A regex check can't hallucinate. An LLM judging an LLM can.
"""

import logging
import re
from datetime import datetime, timezone
from pathlib import Path

logger = logging.getLogger("fabrication_guard")

# Matches things like: "230%", "2.4x", "340 %", "1.8 x faster"
NUMERIC_CLAIM = re.compile(r"\d+(?:\.\d+)?\s*(?:%|x\b)", re.IGNORECASE)

# Where flagged incidents get logged for your own review.
INCIDENT_LOG_PATH = Path(__file__).parent / "fabrication_incidents.log"


def find_unverified_numbers(claim_text: str, report_text: str) -> list[str]:
    """
    Return every numeric claim in claim_text (e.g. "230%", "2.4x") that does
    NOT appear as a raw digit sequence anywhere in report_text.

    This is intentionally strict and literal — it does not try to be smart
    about units or context. A false positive (flagging a real number that
    happens to be phrased differently) is far cheaper than a false negative
    (letting a fabricated stat through).
    """
    found = NUMERIC_CLAIM.findall(claim_text)
    unverified = []
    for raw_match in found:
        digits_only = re.sub(r"[^\d.]", "", raw_match)
        if digits_only and digits_only not in report_text:
            unverified.append(raw_match.strip())
    return unverified


def safe_fallback(alerts: list[dict]) -> str:
    """
    Deterministic, LLM-free fallback used when the model fabricates a stat
    twice in a row. No invented numbers, ever — just references data that's
    already been extracted and verified elsewhere in the pipeline.
    """
    if not alerts:
        return (
            "Your report includes results outside the typical reference "
            "range that are worth reviewing with a doctor."
        )
    worst = alerts[0]
    title = worst.get("title", "one of your results")
    return (
        f"Your {title} result falls outside the normal range and is "
        "flagged for review below."
    )


def log_fabrication_incident(report_text: str, claim_text: str, flagged: list[str]) -> None:
    """Append a record of a caught fabrication so you can audit frequency over time."""
    entry = (
        f"{datetime.now(timezone.utc).isoformat()} | "
        f"flagged={flagged} | "
        f"claim={claim_text!r} | "
        f"report_len={len(report_text)}\n"
    )
    try:
        with open(INCIDENT_LOG_PATH, "a") as f:
            f.write(entry)
    except OSError:
        # Never let logging failures break the actual request.
        logger.warning("Could not write fabrication incident log", exc_info=True)
    logger.warning("Fabrication caught and corrected: %s", flagged)


def verify_and_fix(result: dict, report_text: str, retry_fn) -> dict:
    """
    Main entry point. Wraps a raw analysis result with the 3-layer guardrail:

    1. Regex check against source text.
    2. One retry with a stricter prompt naming the exact violation
       (retry_fn is a callback you provide — see llm_client.py wiring).
    3. Deterministic fallback if the retry still fabricates.

    Returns the (possibly corrected) result dict. Never raises on its own.
    """
    claim = result.get("cohort_risk", "")
    unverified = find_unverified_numbers(claim, report_text)

    if not unverified:
        return result  # clean on first try, nothing to do

    # Layer 2: one retry, telling the model exactly what it fabricated.
    try:
        retried = retry_fn(unverified)
    except Exception:
        logger.warning("Retry call failed, going straight to fallback", exc_info=True)
        retried = None

    if retried is not None:
        retried_claim = retried.get("cohort_risk", "")
        still_unverified = find_unverified_numbers(retried_claim, report_text)
        if not still_unverified:
            return retried  # retry succeeded, ship it
        # retry also fabricated -> fall through to Layer 3
        result = retried
        unverified = still_unverified

    # Layer 3: deterministic fallback, no LLM numbers at all.
    log_fabrication_incident(report_text, claim, unverified)
    result["cohort_risk"] = safe_fallback(result.get("alerts", []))
    return result
