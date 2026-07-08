interface Props {
  previewLines: string[];
  onUpgrade: () => void;
}

const FEATURES = [
  { icon: "🥗", label: "Diet Plan" },
  { icon: "✅", label: "Step-by-Step Actions" },
  { icon: "🧑‍⚕️", label: "Coach Mode" },
];

export default function PremiumHook({ previewLines, onUpgrade }: Props) {
  // premium_preview now comes from the backend as a real JSON array (4-5
  // items) rather than a single string with embedded \n — arrays are
  // structurally enforced by the model's JSON schema, so we reliably get
  // separate items instead of the model collapsing everything into one
  // wrapped paragraph.
  const lines = previewLines.map((l) => l.trim()).filter(Boolean);

  return (
    <div
      style={{
        background: "#ffffff",
        border: "1px solid #e2e8f0",
        borderRadius: "16px",
        padding: "1.5rem",
        marginTop: "1.5rem",
        position: "relative",
        overflow: "hidden",
        boxShadow: "0 10px 25px -5px rgba(0,0,0,0.05)",
      }}
    >
      <h3 style={{ margin: "0 0 0.6rem 0", color: "#111827", fontSize: "1.15rem", fontWeight: 800 }}>
        Your Personalized Health Plan
      </h3>

      {/* Bold, noticeable feature row instead of a plain sentence */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginBottom: "1.1rem" }}>
        {FEATURES.map((f) => (
          <span
            key={f.label}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.35rem",
              background: "#eff6ff",
              color: "#1d4ed8",
              fontWeight: 700,
              fontSize: "0.85rem",
              padding: "0.35rem 0.7rem",
              borderRadius: "999px",
              border: "1px solid #bfdbfe",
            }}
          >
            <span>{f.icon}</span>
            {f.label}
          </span>
        ))}
      </div>
      <p style={{ margin: "0 0 1rem 0", color: "#334155", fontSize: "0.95rem", fontWeight: 600 }}>
        Built from your actual results — not generic advice.
      </p>

      {/* Real AI-generated content, blurred to demonstrate genuine value without giving it away */}
      <div style={{ position: "relative" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.65rem" }}>
          {lines.map((line, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "0.5rem",
                filter: "blur(6px)",
                userSelect: "none",
              }}
            >
              <span style={{ color: "#16a34a", fontWeight: 700, flexShrink: 0 }}>✓</span>
              <p style={{ margin: 0, color: "#334155", fontSize: "0.95rem", lineHeight: 1.5 }}>
                {line}
              </p>
            </div>
          ))}
        </div>

        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.75rem",
            background: "linear-gradient(180deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.9) 55%)",
          }}
        >
          <div style={{ fontSize: "1.75rem" }}>🔒</div>
          <button
            onClick={onUpgrade}
            style={{
              background: "linear-gradient(135deg, #2563eb, #3b82f6)",
              color: "white",
              padding: "12px 24px",
              border: "none",
              borderRadius: "8px",
              fontSize: "0.95rem",
              fontWeight: "bold",
              cursor: "pointer",
              boxShadow: "0 10px 15px -3px rgba(37, 99, 235, 0.3)",
            }}
            onMouseOver={(e) => (e.currentTarget.style.transform = "scale(1.03)")}
            onMouseOut={(e) => (e.currentTarget.style.transform = "scale(1)")}
          >
            Unlock Your Plan — ₹99
          </button>
        </div>
      </div>
    </div>
  );
}
