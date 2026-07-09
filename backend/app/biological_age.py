"""
Simplified biological age estimate — a free 'hook' section.

DELIBERATE DESIGN CHOICE: this is NOT the peer-reviewed PhenoAge formula.
PhenoAge needs precisely unit-converted lab values (creatinine in umol/L,
glucose in mmol/L, etc.), and reports arrive as freeform extracted/OCR'd
text in whatever units the lab used. A silent unit-conversion mistake
would produce a confidently wrong age — worse than showing nothing.

Instead: chronological age is extracted deterministically via regex (no
LLM), and each ABNORMAL finding that matches a known aging-associated
marker adds a small, fixed, capped number of years. No magnitudes, no
invented statistics, nothing an LLM generated.

Three possible outcomes, returned as a dict with a `status` field:
- "computed": age found, at least one relevant marker present -> real estimate.
- "needs_markers": age found, but the report doesn't test any of the
  markers this method knows about -> tell the user what to test for next
  time, instead of just hiding the section.
- None (the Python value, not a dict): no chronological age could be found
  in the report at all. Nothing useful to suggest here (we don't know
  whether age truly isn't on the report, or extraction just missed it),
  so the section stays hidden, same as before.
"""

import re

# marker keyword (matched case-insensitively as a substring of test_name)
# -> (years added if abnormal, category label)
AGING_MARKERS: dict[str, tuple[float, str]] = {
    "c-reactive protein": (2.0, "inflammation"),
    "crp": (2.0, "inflammation"),
    "hba1c": (1.5, "metabolic"),
    "glycated hemoglobin": (1.5, "metabolic"),
    "fasting blood sugar": (1.5, "metabolic"),
    "fasting glucose": (1.5, "metabolic"),
    "glucose": (1.5, "metabolic"),
    "creatinine": (1.5, "renal"),
    "triglyceride": (1.0, "cardiovascular"),
    "ldl": (1.0, "cardiovascular"),
    "alt": (1.0, "hepatic"),
    "sgpt": (1.0, "hepatic"),
    "ast": (1.0, "hepatic"),
    "sgot": (1.0, "hepatic"),
    "white blood cell": (1.0, "immune"),
    "wbc": (1.0, "immune"),
    "albumin": (1.5, "general"),
    "uric acid": (1.0, "metabolic"),
    "vitamin d": (0.5, "general"),
    "hemoglobin": (1.0, "hematologic"),
}

# Curated, deduplicated display list for the "needs_markers" suggestion —
# grouped so it reads as a short shopping list, not all 19 raw keywords.
SUGGESTED_MARKER_LABELS = [
    "CRP (C-Reactive Protein)",
    "HbA1c or Fasting Glucose",
    "Creatinine",
    "Albumin",
    "Lipid Profile (LDL, Triglycerides)",
    "Liver Enzymes (ALT/AST)",
]

MAX_ADJUSTMENT_YEARS = 10.0

_AGE_PATTERNS = [
    re.compile(r"(\d{1,3})\s*[-\s]?years?[-\s]?old", re.IGNORECASE),
    re.compile(r"age\s*/\s*sex\s*[:\-]?\s*(\d{1,3})", re.IGNORECASE),
    re.compile(r"age\s*[:\-]\s*(\d{1,3})\b", re.IGNORECASE),
    re.compile(r"\b(\d{1,3})\s*y\s*/\s*[mf]\b", re.IGNORECASE),
    re.compile(r"\b(\d{1,3})\s*yrs?\b", re.IGNORECASE),
]


def extract_chronological_age(report_text: str) -> int | None:
    """Deterministic regex extraction of the patient's stated age. Returns
    None if no plausible age (1-120) is found — never guesses."""
    for pattern in _AGE_PATTERNS:
        match = pattern.search(report_text)
        if match:
            age = int(match.group(1))
            if 1 <= age <= 120:
                return age
    return None


def compute_biological_age_estimate(report_text: str, findings: list[dict]) -> dict | None:
    """
    Returns:
    - None if no chronological age could be found at all.
    - {"status": "needs_markers", "chronological_age": ..., "suggested_markers": [...]}
      if age is known but none of the report's tests match a known
      aging-associated marker (whether normal or abnormal).
    - {"status": "computed", "chronological_age": ..., "estimated_biological_age": ...,
      "years_added": ..., "contributing_markers": [...]} otherwise. years_added
      can be 0 if every matched marker is normal — that's a real, positive result,
      not a missing one.
    """
    chronological_age = extract_chronological_age(report_text)
    if chronological_age is None:
        return None

    matched_any: list[str] = []       # any finding matching a known marker, normal or abnormal
    contributing_markers: list[str] = []  # only the abnormal ones, which add years
    total_years = 0.0
    seen_finding_names: set[str] = set()

    for finding in findings:
        name = finding.get("test_name", "")
        if not name or name in seen_finding_names:
            continue
        name_lower = name.lower()
        for marker_key, (weight, _category) in AGING_MARKERS.items():
            if marker_key in name_lower:
                seen_finding_names.add(name)
                matched_any.append(name)
                if finding.get("status") == "abnormal":
                    contributing_markers.append(name)
                    total_years += weight
                break  # only count each finding once even if multiple keywords could match

    if not matched_any:
        return {
            "status": "needs_markers",
            "chronological_age": chronological_age,
            "suggested_markers": SUGGESTED_MARKER_LABELS,
        }

    total_years = min(total_years, MAX_ADJUSTMENT_YEARS)
    years_added = round(total_years)

    return {
        "status": "computed",
        "chronological_age": chronological_age,
        "estimated_biological_age": chronological_age + years_added,
        "years_added": years_added,
        "contributing_markers": contributing_markers,
    }
