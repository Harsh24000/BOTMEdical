import type { ReportAnalysis } from "../types";
import HealthCard from "./HealthCard";
import BiologicalAgeHook from "./BiologicalAgeHook";
import WhyUpgradeCard from "./WhyUpgradeCard";

interface Props {
  analysis: ReportAnalysis;
  onUpgrade: () => void;
}

const SEVERITY_STYLES = {
  mild: { bg: "#fefce8", border: "#fde047", bar: "#eab308", text: "#a16207", label: "Mild" },
  moderate: { bg: "#fff7ed", border: "#fdba74", bar: "#f97316", text: "#c2410c", label: "Moderate" },
  severe: { bg: "#fef2f2", border: "#fca5a5", bar: "#ef4444", text: "#b91c1c", label: "Severe" },
} as const;

export default function AnalysisPanel({ analysis, onUpgrade }: Props) {
  return (
    <div className="analysis" style={{ padding: "0.5rem" }}>
      <h2 style={{ fontSize: "2rem", fontWeight: "800", color: "#111827", marginBottom: "0.5rem", marginTop: 0 }}>
        Threat Detection Scan
      </h2>

      {/* Free hook section — drives interest before the gated premium content */}
      <BiologicalAgeHook estimate={analysis.biological_age} />

      {/* Health Snapshot — normal vs abnormal counts */}
      <HealthCard findings={analysis.findings} />

      <h3 style={{ fontSize: "1.25rem", fontWeight: "700", color: "#ef4444", marginBottom: "1rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
        ⚠️ Critical Alerts Detected
      </h3>

      {/* Alert Boxes — capped to exactly 2, matching the reference design.
          If the model found more than 2, the 2 shown are the most severe
          (severe > moderate > mild), not just the first 2 in array order. */}
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginBottom: "2rem" }}>
        {[...analysis.alerts]
          .sort((a, b) => {
            const rank = { severe: 0, moderate: 1, mild: 2 } as const;
            return (rank[a.severity] ?? 1) - (rank[b.severity] ?? 1);
          })
          .slice(0, 2)
          .map((alert, index) => {
          const style = SEVERITY_STYLES[alert.severity] ?? SEVERITY_STYLES.moderate;
          const animationName =
            alert.severity === "severe"
              ? "flash-severe"
              : alert.severity === "moderate"
              ? "pulse-alert"
              : "none";
          const animation =
            animationName === "none" ? "none" : `${animationName} 1.6s ease-in-out infinite`;
          return (
            <div key={index} style={{
              background: style.bg,
              border: `2px solid ${style.border}`,
              borderRadius: "12px",
              padding: "1.5rem",
              boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)",
              animation,
              position: "relative",
              overflow: "hidden"
            }}>
              <div style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "6px",
                height: "100%",
                background: style.bar
              }} />
              <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.5rem" }}>
                <h4 style={{
                  margin: 0,
                  color: style.text,
                  fontSize: "1.2rem",
                  fontWeight: "700"
                }}>
                  {alert.title}
                </h4>
                <span style={{
                  fontSize: "0.7rem",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  color: "#ffffff",
                  background: style.bar,
                  padding: "0.15rem 0.5rem",
                  borderRadius: "999px",
                  animation: alert.severity === "severe" ? "badge-flash 1.6s ease-in-out infinite" : "none",
                }}>
                  {style.label}
                </span>
              </div>
              <p style={{ margin: 0, color: "#475569", fontSize: "1.05rem", lineHeight: "1.5" }}>
                {alert.description}
              </p>
            </div>
          );
        })}
      </div>

      {analysis.alerts.length > 0 && (
        <div style={{ marginBottom: "2rem" }}>
          <WhyUpgradeCard onUpgrade={onUpgrade} />
        </div>
      )}

      <style>{`
        @keyframes pulse-alert {
          0% { box-shadow: 0 0 0 0 rgba(249, 115, 22, 0.35); }
          70% { box-shadow: 0 0 0 10px rgba(249, 115, 22, 0); }
          100% { box-shadow: 0 0 0 0 rgba(249, 115, 22, 0); }
        }
        @keyframes flash-severe {
          0%, 100% {
            border-color: #fca5a5;
            background-color: #fef2f2;
            box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.5);
          }
          50% {
            border-color: #ef4444;
            background-color: #fee2e2;
            box-shadow: 0 0 0 10px rgba(239, 68, 68, 0);
          }
        }
        @keyframes badge-flash {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.55; }
        }
      `}</style>
    </div>
  );
}
