"""
Deterministic per-biomarker "wellness score" for the Biomarker Breakdown
table's circular gauge (0-100). Same philosophy as biological_age.py:
no LLM involved, computed from the report's own printed value and
reference range via regex — never an invented number.

This is a SIMPLIFIED deviation score, not a validated clinical metric —
see WELLNESS_SCORE_DISCLAIMER below, shown in the UI alongside it.
"""

import re

WELLNESS_SCORE_DISCLAIMER = (
    "Simplified score based on how far this value falls from its reference "
    "range — not a validated clinical wellness metric."
)

_FLOAT_RE = re.compile(r"[-+]?\d*\.?\d+")


def _first_float(s: str) -> float | None:
    match = _FLOAT_RE.search(s or "")
    return float(match.group(0)) if match else None


def _parse_range(range_str: str) -> tuple[float | None, float | None] | None:
    """Handles '<100', '> 40', '4.0 - 5.6', '4.0-5.6'. Returns (low, high),
    either of which may be None for one-sided ranges. None if unparseable."""
    if not range_str:
        return None
    s = range_str.strip()

    if s.startswith("<"):
        high = _first_float(s)
        return (None, high) if high is not None else None
    if s.startswith(">"):
        low = _first_float(s)
        return (low, None) if low is not None else None

    numbers = [float(n) for n in _FLOAT_RE.findall(s)]
    if len(numbers) >= 2:
        return (min(numbers[0], numbers[1]), max(numbers[0], numbers[1]))
    return None


def compute_finding_score(value: str, reference_range: str) -> int:
    """Returns 0-100. Falls back to 50 (neutral) if either the value or
    the range can't be confidently parsed — never guesses a direction."""
    val = _first_float(value)
    bounds = _parse_range(reference_range)
    if val is None or bounds is None:
        return 50

    low, high = bounds

    if low is not None and high is not None:
        half_width = (high - low) / 2 or 1.0
        mid = (low + high) / 2
        if low <= val <= high:
            dist_frac = abs(val - mid) / half_width
            score = 100 - dist_frac * 30  # in-range: 70-100
        else:
            edge = low if val < low else high
            overflow = abs(val - edge) / half_width
            score = 70 - overflow * 40  # out-of-range: decays from 70
    elif high is not None:  # only an upper bound, e.g. "<100"
        if val <= high:
            score = 70 + (1 - val / high) * 30 if high else 70
        else:
            overflow = (val - high) / high if high else 1
            score = 70 - overflow * 50
    elif low is not None:  # only a lower bound, e.g. ">40"
        if val >= low:
            score = 85
        else:
            overflow = (low - val) / low if low else 1
            score = 70 - overflow * 50
    else:
        score = 50

    return int(max(0, min(100, round(score))))
