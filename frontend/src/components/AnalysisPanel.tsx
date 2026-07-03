import type { ReportAnalysis } from "../types";

interface Props {
  analysis: ReportAnalysis;
}

export default function AnalysisPanel({ analysis }: Props) {
  // Determine color based on wellness score
  const scoreColor = 
    analysis.wellness_score >= 80 ? "#16a34a" : 
    analysis.wellness_score >= 50 ? "#ca8a04" : "#dc2626";

  return (
    <div className="analysis">
      <h2>Your report analysis</h2>
      
      {/* Wellness Score UI */}
      <div style={{
        display: "flex", 
        alignItems: "center", 
        gap: "1rem", 
        padding: "1rem", 
        background: "#f8fafc", 
        borderRadius: "12px", 
        border: "1px solid #e2e8f0",
        marginBottom: "1rem"
      }}>
        <div style={{
          fontSize: "2rem", 
          fontWeight: "bold", 
          color: scoreColor,
          background: "#fff",
          padding: "1rem",
          borderRadius: "50%",
          width: "80px",
          height: "80px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)"
        }}>
          {analysis.wellness_score}
        </div>
        <div>
          <h3 style={{ margin: 0, color: "#1e293b" }}>Wellness Score</h3>
          <p style={{ margin: 0, color: "#64748b", fontSize: "0.9rem" }}>Out of 100 based on your biomarkers</p>
        </div>
      </div>

      {/* ASCII Percentile Tree */}
      <div style={{
        background: "#1e293b",
        color: "#f8fafc",
        padding: "1rem",
        borderRadius: "8px",
        marginBottom: "1.5rem",
        overflowX: "auto"
      }}>
        <pre style={{ margin: 0, fontFamily: "monospace", fontSize: "0.85rem", lineHeight: "1.4" }}>
          {analysis.percentile_breakdown}
        </pre>
      </div>

      <p className="summary">{analysis.patient_summary}</p>
      <p>{analysis.overall_assessment}</p>
    </div>
  );
}
