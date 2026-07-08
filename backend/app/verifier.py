"""
Guardrail layer with two jobs:

1. (existing) Catch fabricated statistics in cohort_risk — numbers that
   don't trace back to the source report text.
2. (new) Defense-in-depth: strip any stray numeric value that leaks into
   alert descriptions, even though the prompt already instructs the model
   not to include them. Prompts get ignored sometimes; this makes the
   "no numbers in alerts" rule structurally enforced, not just requested.
"""

import logging
import re
from datetime import datetime, timezone
from pathlib import Path

logger = logging.getLogger("fabrication_guard")

# Matches things like: "230%", "2.4x", "340 %", "1.8 x faster"
NUMERIC_CLAIM = re.compile(r"\d+(?:\.\d+)?\s*(?:%|x\b)", re.IGNORECASE)

# Matches a value + common lab unit anywhere in a sentence, e.g. "489.3 mg/dL",
# "8.1 mg/dL", "110 U/L". Used to redact numbers from alert descriptions.
LAB_VALUE_PATTERN = re.compile(
    r"\d+(?:\.\d+)?\s*(?:mg/dL|g/dL|U/L|mmol/L|ng/mL|mIU/L|IU/L|/uL|/µL|%|mg|g|units?)",
    re.IGNORECASE,
)
# Bare numbers left over (e.g. "489.3" with no unit attached)
BARE_NUMBER = re.compile(r"\b\d+(?:\.\d+)?\b")

INCIDENT_LOG_PATH = Path(__file__).parent / "fabrication_incidents.log"


def find_unverified_numbers(claim_text: str, report_text: str) -> list[str]:
    """Return numeric claims in claim_text (e.g. "230%") not present in report_text."""
    found = NUMERIC_CLAIM.findall(claim_text)
    unverified = []
    for raw_match in found:
        digits_only = re.sub(r"[^\d.]", "", raw_match)
        if digits_only and digits_only not in report_text:
            unverified.append(raw_match.strip())
    return unverified


def strip_alert_numbers(alerts: list[dict]) -> list[dict]:
    """
    Remove any numeric value from alert descriptions. This runs regardless
    of whether the model followed instructions, so a stray "489.3 mg/dL"
    can never reach the UI.
    """
    cleaned = []
    for alert in alerts:
        desc = alert.get("description", "")
        original = desc
        desc = LAB_VALUE_PATTERN.sub("", desc)
        desc = BARE_NUMBER.sub("", desc)
        # collapse any double spaces / stray punctuation left behind
        desc = re.sub(r"\s{2,}", " ", desc).strip()
        desc = re.sub(r"\s+([.,])", r"\1", desc)
        if desc != original:
            logger.info("Redacted number(s) from alert description: %r -> %r", original, desc)
        cleaned.append({**alert, "description": desc})
    return cleaned


def safe_fallback(alerts: list[dict]) -> str:
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
        logger.warning("Could not write fabrication incident log", exc_info=True)
    logger.warning("Fabrication caught and corrected: %s", flagged)


def verify_and_fix(result: dict, report_text: str, retry_fn) -> dict:
    """Main entry point for the cohort_risk fabrication guard (unchanged behavior)."""
    claim = result.get("cohort_risk", "")
    unverified = find_unverified_numbers(claim, report_text)

    if not unverified:
        return result

    try:
        retried = retry_fn(unverified)
    except Exception:
        logger.warning("Retry call failed, going straight to fallback", exc_info=True)
        retried = None

    if retried is not None:
        retried_claim = retried.get("cohort_risk", "")
        still_unverified = find_unverified_numbers(retried_claim, report_text)
        if not still_unverified:
            return retried
        result = retried
        unverified = still_unverified

    log_fabrication_incident(report_text, claim, unverified)
    result["cohort_risk"] = safe_fallback(result.get("alerts", []))
    return result
