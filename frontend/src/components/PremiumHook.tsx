interface Props {
  previewText: string;
  onUpgrade: () => void;
}

export default function PremiumHook({ previewText, onUpgrade }: Props) {
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
      <h3 style={{ margin: "0 0 0.25rem 0", color: "#111827", fontSize: "1.15rem", fontWeight: 800 }}>
        Your Personalized Health Plan
      </h3>
      <p style={{ margin: "0 0 1rem 0", color: "#64748b", fontSize: "0.9rem" }}>
        Diet plan, step-by-step actions, and coach mode — built from your actual results.
      </p>

      {/* Real AI-generated content, blurred to demonstrate genuine value without giving it away */}
      <div style={{ position: "relative" }}>
        <p
          style={{
            filter: "blur(6px)",
            userSelect: "none",
            color: "#334155",
            fontSize: "1rem",
            lineHeight: 1.6,
            margin: 0,
          }}
        >
          {previewText}
        </p>

        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.75rem",
            background: "linear-gradient(180deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.85) 60%)",
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
