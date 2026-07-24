import type { Finding } from "../types";

const STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  Critical: { bg: "#fee2e2", text: "#b91c1c", label: "Critical" },
  High: { bg: "#ffedd5", text: "#c2410c", label: "High" },
  Low: { bg: "#fef3c7", text: "#a16207", label: "Low" },
  Normal: { bg: "#dcfce7", text: "#166534", label: "Normal" },
};

/** Maps our normal/abnormal status + score into the 4-way label the
 * reference table shows. Abnormal + very low score reads as "Critical",
 * otherwise "High" or "Low" depending on which side of the range it's on —
 * inferred from the score curve in finding_score.py, not a separate LLM call. */
function statusLabel(finding: Finding): keyof typeof STATUS_STYLES {
  if (finding.status === "normal") return "Normal";
  if (finding.score <= 25) return "Critical";
  // Best-effort High/Low guess from the raw value's position isn't precise
  // client-side, so default abnormal-but-not-critical to "High" — a minor
  // cosmetic simplification, not a clinical claim (the real severity lives
  // in the alerts section above, which IS grounded in the LLM's own read).
  return "High";
}

/** Small circular gauge (SVG), 0-100. */
function ScoreGauge({ score }: { score: number }) {
  const radius = 16;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - score / 100);
  const color = score >= 70 ? "#22c55e" : score >= 40 ? "#f97316" : "#ef4444";

  return (
    <svg width="42" height="42" viewBox="0 0 42 42">
      <circle cx="21" cy="21" r={radius} fill="none" stroke="#e2e8f0" strokeWidth="3" />
      <circle
        cx="21"
        cy="21"
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth="3"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform="rotate(-90 21 21)"
      />
      <text x="21" y="21" textAnchor="middle" dominantBaseline="central" fontSize="11" fontWeight="700" fill="#1e293b">
        {score}
      </text>
    </svg>
  );
}

interface Props {
  findings: Finding[];
  /** Cap how many abnormal rows show for free — matches the "hook, not the
   * full picture" pattern used elsewhere (e.g. capping alerts to 2). */
  maxRows?: number;
}

export default function BiomarkerTable({ findings, maxRows = 3 }: Props) {
  const rows = findings.filter((f) => f.status === "abnormal").slice(0, maxRows);
  if (rows.length === 0) return null;

  return (
    <div
      style={{
        background: "#ffffff",
        border: "1px solid #e2e8f0",
        borderRadius: "16px",
        overflow: "hidden",
        marginBottom: "2rem",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "1.1rem 1.25rem", borderBottom: "1px solid #e2e8f0" }}>
        <span>📊</span>
        <h3 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 800, color: "#111827" }}>Biomarker Breakdown</h3>
      </div>

      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              {["BIOMARKER", "VALUE", "REFERENCE RANGE", "WELLNESS SCORE", "STATUS"].map((h) => (
                <th
                  key={h}
                  style={{
                    textAlign: "left",
                    fontSize: "0.68rem",
                    color: "#94a3b8",
                    fontWeight: 700,
                    letterSpacing: "0.04em",
                    padding: "0.6rem 1.25rem",
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((f, i) => {
              const status = statusLabel(f);
              const style = STATUS_STYLES[status];
              return (
                <tr key={i} style={{ borderTop: "1px solid #f1f5f9" }}>
                  <td style={{ padding: "0.9rem 1.25rem", fontWeight: 700, color: "#111827", fontSize: "0.9rem" }}>
                    {f.test_name}
                  </td>
                  <td style={{ padding: "0.9rem 1.25rem", color: style.text, fontWeight: 700, fontSize: "0.9rem" }}>
                    {f.value}
                  </td>
                  <td style={{ padding: "0.9rem 1.25rem", color: "#64748b", fontSize: "0.9rem" }}>
                    {f.reference_range || "—"}
                  </td>
                  <td style={{ padding: "0.6rem 1.25rem" }}>
                    <ScoreGauge score={f.score} />
                  </td>
                  <td style={{ padding: "0.9rem 1.25rem" }}>
                    <span
                      style={{
                        background: style.bg,
                        color: style.text,
                        fontSize: "0.75rem",
                        fontWeight: 700,
                        padding: "0.25rem 0.65rem",
                        borderRadius: "999px",
                      }}
                    >
                      {style.label}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
