import type { ReportAnalysis } from "../types";

interface Props {
  analysis: ReportAnalysis;
}

function StatusBadge({ status }: { status: string }) {
  return <span className={`badge badge-${status}`}>{status}</span>;
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

      {analysis.findings.length > 0 && (
        <section>
          <h3>Findings</h3>
          <table className="findings">
            <thead>
              <tr>
                <th>Test</th>
                <th>Value</th>
                <th>Reference</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {analysis.findings.map((f, i) => (
                <tr key={i}>
                  <td>
                    <strong>{f.test_name}</strong>
                    <div className="muted small">{f.significance}</div>
                  </td>
                  <td>{f.value}</td>
                  <td>{f.reference_range}</td>
                  <td>
                    <StatusBadge status={f.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {analysis.potential_risks.length > 0 && (
        <section>
          <h3>Potential risks</h3>
          <ul className="risks">
            {analysis.potential_risks.map((r, i) => (
              <li key={i}>
                <span className={`badge sev-${r.severity}`}>{r.severity}</span>{" "}
                <strong>{r.risk}</strong> — {r.explanation}
              </li>
            ))}
          </ul>
        </section>
      )}

      {analysis.recommended_next_steps.length > 0 && (
        <section>
          <h3>Recommended next steps</h3>
          <ul>
            {analysis.recommended_next_steps.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        </section>
      )}

      {analysis.lifestyle_recommendations.length > 0 && (
        <section>
          <h3>Lifestyle suggestions</h3>
          <ul>
            {analysis.lifestyle_recommendations.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        </section>
      )}

      {analysis.questions_for_doctor.length > 0 && (
        <section>
          <h3>Questions to ask your doctor</h3>
          <ul>
            {analysis.questions_for_doctor.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        </section>
      )}

      <p className="disclaimer">{analysis.disclaimer}</p>
    </div>
  );
}
