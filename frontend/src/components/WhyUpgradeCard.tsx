interface Props {
  onUpgrade: () => void;
}

const BENEFITS = [
  {
    title: "15+ Biomarker Trends",
    body: "See how your health is changing over time.",
  },
  {
    title: "Interactive VizApp",
    body: "Explore your body metrics in 3D visualization.",
  },
  {
    title: "Priority Dr. Gyan AI",
    body: "Unlimited questions and deep clinical insights.",
  },
];

/**
 * Static value-prop card — dark navy, checkmark bullets, "Get Full
 * Analysis" CTA. Used in two places (both trigger the same onUpgrade,
 * which opens WhyUpgradeModal — the video hook):
 *   1. App.tsx, directly below the Chat panel
 *   2. AnalysisPanel.tsx, directly below the Critical Alerts section,
 *      so it's the first thing seen after the critical-results moment
 */
export default function WhyUpgradeCard({ onUpgrade }: Props) {
  return (
    <div
      style={{
        background: "linear-gradient(160deg, #0f1a3d 0%, #0a1230 100%)",
        borderRadius: "20px",
        padding: "1.75rem",
        boxShadow: "0 20px 40px -12px rgba(15, 26, 61, 0.45)",
      }}
    >
      <h3 style={{ margin: "0 0 1.25rem 0", color: "#ffffff", fontSize: "1.15rem", fontWeight: 800 }}>
        Why upgrade?
      </h3>

      <div style={{ display: "flex", flexDirection: "column", gap: "1.1rem", marginBottom: "1.5rem" }}>
        {BENEFITS.map((b) => (
          <div key={b.title} style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start" }}>
            <span
              aria-hidden
              style={{
                flexShrink: 0,
                width: "22px",
                height: "22px",
                borderRadius: "999px",
                border: "1.5px solid #34d399",
                color: "#34d399",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "0.7rem",
                fontWeight: 800,
                marginTop: "0.1rem",
              }}
            >
              ✓
            </span>
            <div>
              <div style={{ color: "#ffffff", fontWeight: 700, fontSize: "0.95rem" }}>{b.title}</div>
              <div style={{ color: "#94a3b8", fontSize: "0.83rem", marginTop: "0.15rem", lineHeight: 1.4 }}>
                {b.body}
              </div>
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={onUpgrade}
        style={{
          width: "100%",
          background: "#ffffff",
          color: "#0f1a3d",
          border: "none",
          borderRadius: "999px",
          padding: "0.8rem 1.5rem",
          fontSize: "0.95rem",
          fontWeight: 800,
          cursor: "pointer",
        }}
      >
        Get Full Analysis
      </button>
    </div>
  );
}
