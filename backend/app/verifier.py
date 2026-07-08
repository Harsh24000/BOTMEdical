"""
Guardrail layer with three jobs:

1. Catch fabricated statistics in cohort_risk_base — numbers that don't
   trace back to the source report text.
2. Defense-in-depth: strip any stray numeric value that leaks into alert
   descriptions, even though the prompt already instructs against it.
3. Resolve epi_claim_candidate: only allow an external demographic/
   epidemiological claim through if a live search call (performed by the
   caller, injected as verify_fn) actually confirms it against a real
   source. Fails closed — any error, timeout, or unconfirmed claim means
   nothing is shown, per "verify or omit, never guess."
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


MAX_PREVIEW_LINE_LENGTH = 80


def truncate_preview_lines(lines: list[str]) -> list[str]:
    """
    Defense-in-depth for premium_preview: the prompt asks for short, punchy
    items (~12 words), but nothing structurally stops the model from writing
    a longer sentence anyway. This truncates at a word boundary so the UI
    reliably shows short blurred lines instead of wrapped paragraphs,
    regardless of whether the model followed the length instruction.
    """
    cleaned = []
    for line in lines:
        line = (line or "").strip()
        if len(line) <= MAX_PREVIEW_LINE_LENGTH:
            cleaned.append(line)
            continue
        truncated = line[:MAX_PREVIEW_LINE_LENGTH].rsplit(" ", 1)[0].rstrip(".,;: ")
        cleaned.append(truncated + "…")
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
    """Main entry point for the cohort_risk_base fabrication guard."""
    claim = result.get("cohort_risk_base", "")
    unverified = find_unverified_numbers(claim, report_text)

    if not unverified:
        return result

    try:
        retried = retry_fn(unverified)
    except Exception:
        logger.warning("Retry call failed, going straight to fallback", exc_info=True)
        retried = None

    if retried is not None:
        retried_claim = retried.get("cohort_risk_base", "")
        still_unverified = find_unverified_numbers(retried_claim, report_text)
        if not still_unverified:
            return retried
        result = retried
        unverified = still_unverified

    log_fabrication_incident(report_text, claim, unverified)
    result["cohort_risk_base"] = safe_fallback(result.get("alerts", []))
    return result


EPI_LOG_PATH = Path(__file__).parent / "epi_claim_verifications.log"


def log_epi_verification(candidate: str, verified_claim: str | None, verified: bool) -> None:
    """Audit trail of every epi-claim verification attempt, pass or fail."""
    entry = (
        f"{datetime.now(timezone.utc).isoformat()} | "
        f"verified={verified} | "
        f"candidate={candidate!r} | "
        f"result={verified_claim!r}\n"
    )
    try:
        with open(EPI_LOG_PATH, "a") as f:
            f.write(entry)
    except OSError:
        logger.warning("Could not write epi-claim verification log", exc_info=True)


def resolve_epi_claim(candidate: str, verify_fn) -> str:
    """
    Returns a verified, source-backed addendum to append to cohort_risk_base,
    or an empty string if the claim couldn't be confirmed. Fails closed:
    any exception, empty candidate, or "not verified" result means nothing
    is shown to the patient — silence, not a placeholder or apology.
    """
    candidate = (candidate or "").strip()
    if not candidate:
        return ""

    try:
        verified, verified_claim = verify_fn(candidate)
    except Exception:
        logger.warning("Epi-claim verification call failed; omitting claim", exc_info=True)
        log_epi_verification(candidate, None, verified=False)
        return ""

    if verified and verified_claim:
        log_epi_verification(candidate, verified_claim, verified=True)
        return verified_claim.strip()

    log_epi_verification(candidate, None, verified=False)
    return ""
