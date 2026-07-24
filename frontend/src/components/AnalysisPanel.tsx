import type { ReportAnalysis } from "../types";
import HealthCard from "./HealthCard";
import BiologicalAgeHook from "./BiologicalAgeHook";
import WhyUpgradeCard from "./WhyUpgradeCard";
import BiomarkerTable from "./BiomarkerTable";

interface Props {
  analysis: ReportAnalysis;
  onUpgrade: () => void;
}

const SEVERITY_STYLES = {
  mild: { border: "#fde047", iconBg: "#fef9c3", text: "#a16207", icon: "➕" },
  moderate: { border: "#fdba74", iconBg: "#ffedd5", text: "#c2410c", icon: "➕" },
  severe: { border: "#fca5a5", iconBg: "#fee2e2", text: "#b91c1c", icon: "⚠️" },
} as const;

export default function AnalysisPanel({ analysis, onUpgrade }: Props) {
  return (
    <div className="analysis" style={{ padding: "0.5rem" }}>

      {/* Free hook section — drives interest before the gated premium content */}
      <BiologicalAgeHook estimate={analysis.biological_age} />

      {/* Health Snapshot — normal vs abnormal counts */}
      <HealthCard findings={analysis.findings} />

      <BiomarkerTable findings={analysis.findings} />

      <h3 style={{ fontSize: "1.4rem", fontWeight: 800, color: "#111827", marginBottom: "1rem" }}>
        Medical Interpretation
      </h3>

      {/* Capped to exactly 2, matching the reference. If the model found
          more than 2, the 2 shown are the most severe (severe > moderate >
          mild), not just the first 2 in array order. */}
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginBottom: "2rem" }}>
        {[...analysis.alerts]
          .sort((a, b) => {
            const rank = { severe: 0, moderate: 1, mild: 2 } as const;
            return (rank[a.severity] ?? 1) - (rank[b.severity] ?? 1);
          })
          .slice(0, 2)
          .map((alert, index) => {
          const style = SEVERITY_STYLES[alert.severity] ?? SEVERITY_STYLES.moderate;
          const heading = alert.severity === "severe" ? `Critical Finding: ${alert.title}` : `${alert.title} Analysis`;
          return (
            <div key={index} style={{
              background: "#ffffff",
              border: `1.5px solid ${style.border}`,
              borderRadius: "12px",
              padding: "1.25rem 1.5rem",
            }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem" }}>
                <div style={{
                  width: "30px",
                  height: "30px",
                  borderRadius: "8px",
                  background: style.iconBg,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "0.95rem",
                  flexShrink: 0,
                  marginTop: "0.1rem",
                }}>
                  {style.icon}
                </div>
                <div>
                  <h4 style={{ margin: "0 0 0.35rem 0", color: style.text, fontSize: "1.05rem", fontWeight: 700 }}>
                    {heading}
                  </h4>
                  <p style={{ margin: 0, color: "#475569", fontSize: "0.95rem", lineHeight: 1.5 }}>
                    {alert.description}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {analysis.alerts.length > 0 && (
        <div style={{ marginBottom: "2rem" }}>
          <WhyUpgradeCard onUpgrade={onUpgrade} />
        </div>
      )}
    </div>
  );
}
