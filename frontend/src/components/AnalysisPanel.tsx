import type { ReportAnalysis } from "../types";

interface Props {
  analysis: ReportAnalysis;
}

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
        marginBottom: "2rem",
        color: "#334155",
        fontSize: "1.1rem",
        fontWeight: "500"
      }}>
        <strong style={{ color: "#1e293b" }}>Epidemiological Risk Factor: </strong>
        {analysis.cohort_risk}
      </div>

      <h3 style={{ fontSize: "1.25rem", fontWeight: "700", color: "#ef4444", marginBottom: "1rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
        ⚠️ Critical Alerts Detected
      </h3>

      {/* Alert Boxes */}
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginBottom: "2rem" }}>
        {analysis.alerts.map((alert, index) => (
          <div key={index} style={{
            background: alert.severity === "red" ? "#fef2f2" : "#fff7ed",
            border: `1px solid ${alert.severity === "red" ? "#fca5a5" : "#fdba74"}`,
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
              background: alert.severity === "red" ? "#ef4444" : "#f97316"
            }} />
            <h4 style={{ 
              margin: "0 0 0.5rem 0", 
              color: alert.severity === "red" ? "#b91c1c" : "#c2410c", 
              fontSize: "1.2rem", 
              fontWeight: "700" 
            }}>
              {alert.title}
            </h4>
            <p style={{ margin: 0, color: "#475569", fontSize: "1.05rem", lineHeight: "1.5" }}>
              {alert.description}
            </p>
          </div>
        ))}
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
