import type { ReportAnalysis } from "../types";
import HealthCard from "./HealthCard";

interface Props {
  analysis: ReportAnalysis;
}

const SEVERITY_STYLES = {
  mild: { bg: "#fefce8", border: "#fde047", bar: "#eab308", text: "#a16207", label: "Mild" },
  moderate: { bg: "#fff7ed", border: "#fdba74", bar: "#f97316", text: "#c2410c", label: "Moderate" },
  severe: { bg: "#fef2f2", border: "#fca5a5", bar: "#ef4444", text: "#b91c1c", label: "Severe" },
} as const;

export default function AnalysisPanel({ analysis }: Props) {
  return (
    <div className="analysis" style={{ padding: "0.5rem" }}>
      <h2 style={{ fontSize: "2rem", fontWeight: "800", color: "#111827", marginBottom: "0.5rem", marginTop: 0 }}>
        Threat Detection Scan
      </h2>

      {/* Cohort Risk Statement */}
      <div style={{
        background: "#f8fafc",
        borderLeft: "4px solid #3b82f6",
        padding: "1rem 1.5rem",
        borderRadius: "0 8px 8px 0",
        marginBottom: "1.5rem",
        color: "#334155",
        fontSize: "1.1rem",
        fontWeight: "500"
      }}>
        <strong style={{ color: "#1e293b" }}>Epidemiological Risk Factor: </strong>
        {analysis.cohort_risk}
      </div>

      {/* Health Snapshot — normal vs abnormal counts */}
      <HealthCard findings={analysis.findings} />

      <h3 style={{ fontSize: "1.25rem", fontWeight: "700", color: "#ef4444", marginBottom: "1rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
        ⚠️ Critical Alerts Detected
      </h3>

      {/* Alert Boxes */}
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginBottom: "2rem" }}>
        {analysis.alerts.map((alert, index) => {
          const style = SEVERITY_STYLES[alert.severity] ?? SEVERITY_STYLES.moderate;
          return (
            <div key={index} style={{
              background: style.bg,
              border: `1px solid ${style.border}`,
              borderRadius: "12px",
              padding: "1.5rem",
              boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)",
              animation: "pulse-alert 2s infinite",
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

      <style>{`
        @keyframes pulse-alert {
          0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4); }
          70% { box-shadow: 0 0 0 10px rgba(239, 68, 68, 0); }
          100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
        }
      `}</style>
    </div>
  );
}
