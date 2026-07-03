import type { ReportAnalysis } from "../types";

interface Props {
  analysis: ReportAnalysis;
}

export default function AnalysisPanel({ analysis }: Props) {
  const scoreColor = 
    analysis.wellness_score >= 80 ? "#10b981" : 
    analysis.wellness_score >= 50 ? "#f59e0b" : "#ef4444";

  const scoreGradient = 
    analysis.wellness_score >= 80 ? "linear-gradient(135deg, #d1fae5, #10b981)" : 
    analysis.wellness_score >= 50 ? "linear-gradient(135deg, #fef3c7, #f59e0b)" : 
    "linear-gradient(135deg, #fee2e2, #ef4444)";

  return (
    <div className="analysis" style={{ padding: "0.5rem" }}>
      <h2 style={{ fontSize: "2rem", fontWeight: "800", color: "#111827", marginBottom: "1.5rem", marginTop: 0 }}>
        Your Health Overview
      </h2>
      
      {/* Premium Wellness Score Card */}
      <div style={{
        display: "flex", 
        alignItems: "center", 
        gap: "1.5rem", 
        padding: "1.5rem", 
        background: "linear-gradient(to right, #ffffff, #f8fafc)", 
        borderRadius: "16px", 
        border: "1px solid #e2e8f0",
        boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.05)",
        marginBottom: "2rem",
        position: "relative",
        overflow: "hidden"
      }}>
        <div style={{
          position: "absolute", top: "-20px", right: "-20px", width: "150px", height: "150px",
          background: scoreGradient, opacity: 0.1, borderRadius: "50%", filter: "blur(20px)"
        }} />

        <div style={{
          fontSize: "2.5rem", fontWeight: "900", color: "#fff", background: scoreGradient,
          padding: "1rem", borderRadius: "50%", width: "100px", height: "100px",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
          border: "4px solid white", zIndex: 1
        }}>
          {analysis.wellness_score}
        </div>
        <div style={{ zIndex: 1 }}>
          <h3 style={{ margin: "0 0 0.5rem 0", color: "#1e293b", fontSize: "1.5rem", fontWeight: "700" }}>Wellness Score</h3>
          <p style={{ margin: 0, color: "#64748b", fontSize: "1rem", lineHeight: "1.5" }}>
            A comprehensive metric based on your clinical biomarkers.
          </p>
        </div>
      </div>

      {/* Premium Summary Card */}
      <div style={{
        background: "#ffffff", padding: "2rem", borderRadius: "16px",
        border: "1px solid #e2e8f0", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.02)",
        marginBottom: "2rem"
      }}>
        <h4 style={{ color: "#3b82f6", fontSize: "0.875rem", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: "700", marginBottom: "1rem", marginTop: 0 }}>
          Executive Summary
        </h4>
        <p style={{ fontSize: "1.25rem", fontWeight: "600", color: "#1e293b", marginTop: 0, marginBottom: "1rem", lineHeight: "1.5" }}>
          {analysis.patient_summary}
        </p>
        <div style={{ height: "1px", background: "#e2e8f0", margin: "1.5rem 0" }} />
        <p style={{ fontSize: "1.1rem", lineHeight: "1.7", color: "#475569", margin: 0 }}>
          {analysis.overall_assessment}
        </p>
      </div>

      {/* ASCII Percentile Tree - Dark Mode */}
      <div style={{
        background: "linear-gradient(to bottom right, #0f172a, #1e293b)", color: "#f8fafc",
        padding: "1.5rem", borderRadius: "16px", boxShadow: "inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)",
        overflowX: "auto", border: "1px solid #334155"
      }}>
        <h4 style={{ color: "#38bdf8", fontSize: "0.875rem", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: "700", marginBottom: "1rem", marginTop: 0 }}>
          Demographic Percentiles
        </h4>
        <pre style={{ margin: 0, fontFamily: "monospace", fontSize: "0.9rem", lineHeight: "1.5", color: "#e2e8f0" }}>
          {analysis.percentile_breakdown}
        </pre>
      </div>
    </div>
  );
}
