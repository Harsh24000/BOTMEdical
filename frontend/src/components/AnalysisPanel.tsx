import type { ReportAnalysis } from "../types";

interface Props {
  analysis: ReportAnalysis;
}

function StatusBadge({ status }: { status: string }) {
  return <span className={`badge badge-${status}`}>{status}</span>;
}

export default function AnalysisPanel({ analysis }: Props) {
  return (
    <div className="analysis">
      <h2>Your report analysis</h2>
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
