import type { BiologicalAgeEstimate } from "../types";

interface Props {
  estimate: BiologicalAgeEstimate | null;
}

export default function BiologicalAgeHook({ estimate }: Props) {
  // No chronological age found at all — nothing useful to suggest, stays hidden.
  if (!estimate) return null;

  if (estimate.status === "needs_markers") {
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
        <p style={{ margin: "0 0 0.75rem 0", fontSize: "1rem", color: "#334155" }}>
          This report doesn't include the tests needed to estimate your biological age.
          Add any of these to your next lab work to see it:
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
          {(estimate.suggested_markers ?? []).map((marker) => (
            <span
              key={marker}
              style={{
                background: "#ffffff",
                border: "1px solid #c7d2fe",
                borderRadius: "999px",
                padding: "0.3rem 0.75rem",
                fontSize: "0.85rem",
                fontWeight: 600,
                color: "#4338ca",
              }}
            >
              {marker}
            </span>
          ))}
        </div>
      </div>
    );
  }

  // status === "computed"
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
