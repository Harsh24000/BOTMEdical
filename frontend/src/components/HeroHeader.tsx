interface Props {
  patientName: string;
  sessionId: string;
  biomarkerCount: number;
  wellnessScore: number;
}

/** Deterministic, non-secret display ID derived from the session UUID —
 * purely cosmetic (matches the reference's "Analysis ID: #XXXX-XX" look),
 * not a real lookup key. */
function displayAnalysisId(sessionId: string): string {
  const clean = sessionId.replace(/-/g, "").toUpperCase();
  return `${clean.slice(0, 4)}-${clean.slice(-2)}`;
}

export default function HeroHeader({ patientName, sessionId, biomarkerCount, wellnessScore }: Props) {
  const firstName = patientName ? patientName.split(/\s+/)[0] : "";

  return (
    <div style={{ marginBottom: "1.5rem" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.75rem" }}>
        <span
          style={{
            background: "#dcfce7",
            color: "#166534",
            fontSize: "0.68rem",
            fontWeight: 800,
            letterSpacing: "0.04em",
            padding: "0.25rem 0.65rem",
            borderRadius: "999px",
          }}
        >
          REPORT STATUS: UNLOCKED
        </span>
        <span style={{ color: "#94a3b8", fontSize: "0.8rem" }}>
          Analysis ID: #{displayAnalysisId(sessionId)}
        </span>
      </div>

      <h1 style={{ fontSize: "2rem", fontWeight: 800, color: "#111827", margin: "0 0 0.6rem 0", lineHeight: 1.25 }}>
        {firstName ? `Welcome back, ${patientName}. ` : "Your results are ready. "}
        <span style={{ color: "#2563eb" }}>Your health story is now clear.</span>
      </h1>

      <p style={{ color: "#475569", fontSize: "1rem", margin: 0, lineHeight: 1.6 }}>
        We've decoded {biomarkerCount} biomarker{biomarkerCount === 1 ? "" : "s"} from your recent lab
        report. Your overall Wellness Score is <strong>{wellnessScore}/100</strong>.
      </p>
    </div>
  );
}
