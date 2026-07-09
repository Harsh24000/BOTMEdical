import { useState } from "react";
import type { BiologicalAgeEstimate } from "../types";

interface Props {
  estimate: BiologicalAgeEstimate | null;
}

// Same weight table as backend/app/biological_age.py, plus a standard
// adult reference range per marker so a manually-typed number (with no
// report/reference-range context of its own) can still be classified as
// normal/abnormal. These are general textbook adult ranges — not
// personalized to age/sex/lab, which is disclosed in the UI.
interface MarkerInput {
  key: string;
  label: string;
  unit: string;
  weight: number;
  isAbnormal: (value: number) => boolean;
  rangeHint: string;
}

const MARKER_INPUTS: MarkerInput[] = [
  { key: "crp", label: "CRP", unit: "mg/L", weight: 2.0, isAbnormal: (v) => v >= 3.0, rangeHint: "normal < 3.0" },
  { key: "hba1c", label: "HbA1c", unit: "%", weight: 1.5, isAbnormal: (v) => v >= 5.7, rangeHint: "normal < 5.7" },
  { key: "glucose", label: "Fasting Glucose", unit: "mg/dL", weight: 1.5, isAbnormal: (v) => v >= 100, rangeHint: "normal < 100" },
  { key: "creatinine", label: "Creatinine", unit: "mg/dL", weight: 1.5, isAbnormal: (v) => v < 0.6 || v > 1.3, rangeHint: "normal 0.6\u20131.3" },
  { key: "albumin", label: "Albumin", unit: "g/dL", weight: 1.5, isAbnormal: (v) => v < 3.5 || v > 5.0, rangeHint: "normal 3.5\u20135.0" },
  { key: "ldl", label: "LDL Cholesterol", unit: "mg/dL", weight: 1.0, isAbnormal: (v) => v >= 100, rangeHint: "normal < 100" },
  { key: "triglycerides", label: "Triglycerides", unit: "mg/dL", weight: 1.0, isAbnormal: (v) => v >= 150, rangeHint: "normal < 150" },
  { key: "alt", label: "ALT", unit: "U/L", weight: 1.0, isAbnormal: (v) => v < 7 || v > 56, rangeHint: "normal 7\u201356" },
  { key: "ast", label: "AST", unit: "U/L", weight: 1.0, isAbnormal: (v) => v < 8 || v > 48, rangeHint: "normal 8\u201348" },
];

const MAX_ADJUSTMENT_YEARS = 10;

interface ManualResult {
  chronological_age: number;
  estimated_biological_age: number;
  years_added: number;
  contributing_markers: string[];
}

export default function BiologicalAgeHook({ estimate }: Props) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [ageInput, setAgeInput] = useState("");
  const [manualResult, setManualResult] = useState<ManualResult | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  // No estimate object at all shouldn't happen anymore (backend always
  // returns a status), but guard defensively rather than crash.
  if (!estimate) return null;

  const needsAgeInput = estimate.status === "needs_age";
  const showForm = estimate.status === "needs_markers" || estimate.status === "needs_age";

  function handleCalculate() {
    if (!showForm) return;

    // Resolve the anchor age: from the report if we have it, otherwise
    // whatever the user just typed.
    let anchorAge: number;
    if (estimate!.chronological_age !== null) {
      anchorAge = estimate!.chronological_age;
    } else {
      const typed = Number(ageInput);
      if (ageInput.trim() === "" || Number.isNaN(typed) || typed < 1 || typed > 120) {
        setFormError("Enter a valid age (1\u2013120) to calculate.");
        setManualResult(null);
        return;
      }
      anchorAge = typed;
    }

    const contributing: string[] = [];
    let totalYears = 0;
    const missingFields: string[] = [];

    for (const marker of MARKER_INPUTS) {
      const raw = values[marker.key];
      if (raw === undefined || raw.trim() === "") {
        missingFields.push(marker.label);
        continue;
      }
      const num = Number(raw);
      if (Number.isNaN(num)) {
        missingFields.push(marker.label);
        continue;
      }
      if (marker.isAbnormal(num)) {
        contributing.push(marker.label);
        totalYears += marker.weight;
      }
    }

    // Strict: every marker field is required, not just one. Partial data
    // isn't accepted — this method only produces a result when the full
    // set of tracked markers has been entered.
    if (missingFields.length > 0) {
      setFormError(`Enter a value for all fields to calculate. Missing: ${missingFields.join(", ")}`);
      setManualResult(null);
      return;
    }

    setFormError(null);
    const yearsAdded = Math.round(Math.min(totalYears, MAX_ADJUSTMENT_YEARS));
    setManualResult({
      chronological_age: anchorAge,
      estimated_biological_age: anchorAge + yearsAdded,
      years_added: yearsAdded,
      contributing_markers: contributing,
    });
  }

  function handleReset() {
    setManualResult(null);
    setValues({});
    setAgeInput("");
    setFormError(null);
  }

  if (showForm) {
    // Show the manually-calculated result if the user has already submitted the form.
    if (manualResult) {
      const isElevated = manualResult.years_added > 0;
      return (
        <div
          style={{
            background: isElevated
              ? "linear-gradient(135deg, #fef2f2 0%, #fff7ed 100%)"
              : "#f8fafc",
            border: `1px solid ${isElevated ? "#fca5a5" : "#e2e8f0"}`,
            borderRadius: "12px",
            padding: "1.25rem 1.5rem",
            marginBottom: "1.5rem",
          }}
        >
          <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.5rem" }}>
            Estimated Biological Age
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: "0.75rem", flexWrap: "wrap" }}>
            <span style={{ fontSize: "2.75rem", fontWeight: 800, color: isElevated ? "#b91c1c" : "#1e293b", lineHeight: 1 }}>
              {manualResult.estimated_biological_age}
            </span>
            <span style={{ fontSize: "1rem", color: "#64748b" }}>
              vs. your actual age of {manualResult.chronological_age}
              {isElevated && (
                <span style={{ color: "#b91c1c", fontWeight: 700 }}> (+{manualResult.years_added} years)</span>
              )}
            </span>
          </div>
          {isElevated ? (
            <p style={{ margin: "0.5rem 0 0 0", fontSize: "0.95rem", color: "#475569" }}>
              Driven by: {manualResult.contributing_markers.join(", ")}
            </p>
          ) : (
            <p style={{ margin: "0.5rem 0 0 0", fontSize: "0.95rem", color: "#16a34a" }}>
              No aging-accelerating markers among the values you entered.
            </p>
          )}
          <p style={{ margin: "0.75rem 0 0 0", fontSize: "0.78rem", color: "#94a3b8", fontStyle: "italic" }}>
            Based on values you entered manually, checked against general adult reference
            ranges (not personalized to age/sex/lab) — not a clinical or validated
            measurement of biological age.
          </p>
          <button
            onClick={handleReset}
            style={{
              marginTop: "0.75rem",
              background: "none",
              border: "none",
              color: "#4f46e5",
              fontSize: "0.85rem",
              fontWeight: 600,
              cursor: "pointer",
              padding: 0,
            }}
          >
            ← Edit values
          </button>
        </div>
      );
    }

    // The entry form itself.
    return (
      <div
        style={{
          background: "linear-gradient(135deg, #eff6ff 0%, #f5f3ff 100%)",
          border: "1px solid #c7d2fe",
          borderRadius: "12px",
          padding: "1.25rem 1.5rem",
          marginBottom: "1.5rem",
        }}
      >
        <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#4f46e5", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.5rem" }}>
          Unlock Your Biological Age
        </div>
        <p style={{ margin: "0 0 1rem 0", fontSize: "0.95rem", color: "#334155" }}>
          {needsAgeInput
            ? "This report doesn't include your age or the tests needed to estimate your biological age. Enter your age and every value below to see it:"
            : "This report doesn't include the tests needed to estimate your biological age. Enter every value below (from a recent test) to see it:"}
        </p>

        {needsAgeInput && (
          <div style={{ marginBottom: "0.75rem", maxWidth: "160px" }}>
            <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: "#334155", marginBottom: "0.25rem" }}>
              Your Age
            </label>
            <input
              type="number"
              step="1"
              inputMode="numeric"
              placeholder="e.g. 35"
              value={ageInput}
              onChange={(e) => setAgeInput(e.target.value)}
              style={{
                width: "100%",
                padding: "0.5rem 0.6rem",
                borderRadius: "8px",
                border: "1px solid #c7d2fe",
                fontSize: "0.9rem",
                boxSizing: "border-box",
              }}
            />
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: "0.75rem", marginBottom: "0.75rem" }}>
          {MARKER_INPUTS.map((marker) => (
            <div key={marker.key}>
              <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: "#334155", marginBottom: "0.25rem" }}>
                {marker.label} <span style={{ color: "#94a3b8", fontWeight: 400 }}>({marker.unit})</span>
              </label>
              <input
                type="number"
                step="any"
                inputMode="decimal"
                placeholder={marker.rangeHint}
                value={values[marker.key] ?? ""}
                onChange={(e) => setValues((prev) => ({ ...prev, [marker.key]: e.target.value }))}
                style={{
                  width: "100%",
                  padding: "0.5rem 0.6rem",
                  borderRadius: "8px",
                  border: "1px solid #c7d2fe",
                  fontSize: "0.9rem",
                  boxSizing: "border-box",
                }}
              />
            </div>
          ))}
        </div>

        {formError && (
          <p style={{ margin: "0 0 0.75rem 0", fontSize: "0.85rem", color: "#dc2626" }}>{formError}</p>
        )}

        <button
          onClick={handleCalculate}
          style={{
            background: "linear-gradient(135deg, #4f46e5, #6366f1)",
            color: "white",
            border: "none",
            borderRadius: "8px",
            padding: "0.6rem 1.25rem",
            fontSize: "0.9rem",
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          Calculate My Biological Age
        </button>
      </div>
    );
  }

  // status === "computed" — value came straight from the report itself.
  const { chronological_age, estimated_biological_age, years_added, contributing_markers } = estimate;
  const isElevated = (years_added ?? 0) > 0;

  return (
    <div
      style={{
        background: isElevated
          ? "linear-gradient(135deg, #fef2f2 0%, #fff7ed 100%)"
          : "#f8fafc",
        border: `1px solid ${isElevated ? "#fca5a5" : "#e2e8f0"}`,
        borderRadius: "12px",
        padding: "1.25rem 1.5rem",
        marginBottom: "1.5rem",
      }}
    >
      <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.5rem" }}>
        Estimated Biological Age
      </div>

      <div style={{ display: "flex", alignItems: "baseline", gap: "0.75rem", flexWrap: "wrap" }}>
        <span style={{ fontSize: "2.75rem", fontWeight: 800, color: isElevated ? "#b91c1c" : "#1e293b", lineHeight: 1 }}>
          {estimated_biological_age}
        </span>
        <span style={{ fontSize: "1rem", color: "#64748b" }}>
          vs. your actual age of {chronological_age}
          {isElevated && (
            <span style={{ color: "#b91c1c", fontWeight: 700 }}> (+{years_added} years)</span>
          )}
        </span>
      </div>

      {isElevated ? (
        <p style={{ margin: "0.5rem 0 0 0", fontSize: "0.95rem", color: "#475569" }}>
          Driven by: {(contributing_markers ?? []).join(", ")}
        </p>
      ) : (
        <p style={{ margin: "0.5rem 0 0 0", fontSize: "0.95rem", color: "#16a34a" }}>
          No aging-accelerating markers found among the ones tested.
        </p>
      )}

      <p style={{ margin: "0.75rem 0 0 0", fontSize: "0.78rem", color: "#94a3b8", fontStyle: "italic" }}>
        Simplified estimate based on abnormal markers in your report — not a clinical or
        validated measurement of biological age.
      </p>
    </div>
  );
}
