interface Props {
  sessionId: string;
  questions: string[];
}

export default function Chat({ questions }: Props) {
  return (
    <div className="chat" style={{ display: "flex", flexDirection: "column", height: "100%", position: "relative" }}>
      <h2>Ask about your results</h2>

      <div className="messages" style={{ flexGrow: 1, position: "relative", overflow: "hidden" }}>
        
        {/* Dynamic, Personalized Suggestions (Blurred) */}
        <div className="suggestions" style={{ filter: "blur(4px)", opacity: 0.6, userSelect: "none" }}>
          <p style={{ fontWeight: "600", color: "#4b5563", marginBottom: "1rem" }}>
            Based on your report, ask Dr. Gyan:
          </p>
          {questions.map((q, i) => (
            <div key={i} style={{ 
              background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "8px", 
              padding: "12px 16px", marginBottom: "12px", color: "#1e293b", fontSize: "1rem",
              boxShadow: "0 1px 2px rgba(0,0,0,0.05)"
            }}>
              💡 {q}
            </div>
          ))}
        </div>
        
        {/* Paywall Overlay */}
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(255, 255, 255, 0.7)", display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center", padding: "2rem",
          textAlign: "center", zIndex: 10
        }}>
          <div style={{ fontSize: "3.5rem", marginBottom: "1rem", textShadow: "0 4px 12px rgba(0,0,0,0.1)" }}>🔒</div>
          <h3 style={{ margin: "0 0 0.5rem 0", color: "#111827", fontSize: "1.5rem" }}>Unlock AI Doctor Chat</h3>
          <p style={{ color: "#4b5563", marginBottom: "2rem", maxWidth: "300px", lineHeight: "1.5" }}>
            Get unlimited, personalized medical answers from Dr. Gyan based on your exact biomarkers.
          </p>
          <button style={{
            background: "linear-gradient(135deg, #2563eb, #3b82f6)", color: "white",
            padding: "14px 28px", border: "none", borderRadius: "50px", fontSize: "1.1rem",
            fontWeight: "bold", cursor: "pointer", boxShadow: "0 10px 15px -3px rgba(37, 99, 235, 0.3)",
            width: "100%", maxWidth: "280px", transition: "transform 0.2s"
          }}
          onMouseOver={(e) => e.currentTarget.style.transform = "scale(1.05)"}
          onMouseOut={(e) => e.currentTarget.style.transform = "scale(1)"}
          >
            Upgrade for ₹99
          </button>
        </div>
      </div>
    </div>
  );
}
