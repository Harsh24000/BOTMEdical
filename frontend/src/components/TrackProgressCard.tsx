interface Props {
  onUpgrade: () => void;
}

export default function TrackProgressCard({ onUpgrade }: Props) {
  return (
    <div
      style={{
        background: "#eff6ff",
        border: "1px solid #dbeafe",
        borderRadius: "16px",
        padding: "1.25rem",
        minWidth: "240px",
        maxWidth: "280px",
      }}
    >
      <div
        style={{
          width: "36px",
          height: "36px",
          borderRadius: "10px",
          background: "#dbeafe",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "1.1rem",
          marginBottom: "0.75rem",
        }}
      >
        📈
      </div>
      <h3 style={{ margin: "0 0 0.4rem 0", fontSize: "1rem", fontWeight: 800, color: "#111827" }}>
        Track Your Progress
      </h3>
      <p style={{ margin: "0 0 1rem 0", fontSize: "0.85rem", color: "#475569", lineHeight: 1.5 }}>
        See how your biomarkers have changed over time with our Longitudinal Trends Report.
      </p>
      <button
        onClick={onUpgrade}
        style={{
          width: "100%",
          background: "#2563eb",
          color: "#ffffff",
          border: "none",
          borderRadius: "10px",
          padding: "0.65rem 1rem",
          fontWeight: 700,
          fontSize: "0.85rem",
          cursor: "pointer",
        }}
      >
        Unlock Trends (₹150)
      </button>
    </div>
  );
}
