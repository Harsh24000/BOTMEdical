export default function Chat() {
  return (
    <div className="chat" style={{ display: "flex", flexDirection: "column", height: "100%", justifyContent: "center" }}>
      <div style={{
        background: "#ffffff",
        border: "1px solid #e2e8f0",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "3rem 2rem",
        textAlign: "center",
        borderRadius: "16px",
        boxShadow: "0 10px 25px -5px rgba(0,0,0,0.05)"
      }}>
        <div style={{ fontSize: "4rem", marginBottom: "1.5rem" }}>🤖</div>
        <h3 style={{ margin: "0 0 1rem 0", color: "#111827", fontSize: "1.75rem", fontWeight: "800" }}>
          Unlock the Smart Report
        </h3>
        <p style={{ color: "#475569", marginBottom: "2rem", maxWidth: "320px", lineHeight: "1.6", fontSize: "1.1rem" }}>
          Get a comprehensive, detailed breakdown of your results and chat directly with Dr. Gyan to build a personalized health plan.
        </p>
        <button style={{
          background: "linear-gradient(135deg, #2563eb, #3b82f6)",
          color: "white",
          padding: "16px 32px",
          border: "none",
          borderRadius: "8px",
          fontSize: "1.1rem",
          fontWeight: "bold",
          cursor: "pointer",
          boxShadow: "0 10px 15px -3px rgba(37, 99, 235, 0.3)",
          width: "100%",
          maxWidth: "280px",
          transition: "transform 0.2s"
        }}
        onMouseOver={(e) => e.currentTarget.style.transform = "scale(1.03)"}
        onMouseOut={(e) => e.currentTarget.style.transform = "scale(1)"}
        >
          Upgrade for ₹99
        </button>
      </div>
    </div>
  );
}
