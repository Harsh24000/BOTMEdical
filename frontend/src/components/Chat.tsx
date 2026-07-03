interface Props {
  sessionId: string;
  questions: string[];
}

export default function Chat({ questions }: Props) {
  return (
    <div className="chat" style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <h2>Ask about your results</h2>

      <div className="messages" style={{ flexGrow: 1, display: "flex", flexDirection: "column" }}>
        
        {/* Dynamic Suggestions (Clearly visible) */}
        <div className="suggestions" style={{ marginBottom: "2rem" }}>
          <p className="muted" style={{ fontWeight: "600", color: "#4b5563" }}>Based on your results, try asking:</p>
          {questions.map((q) => (
            <button key={q} disabled style={{ 
              cursor: "not-allowed", 
              background: "#f8fafc", 
              border: "1px solid #e2e8f0", 
              borderRadius: "8px", 
              padding: "12px", 
              marginBottom: "8px", 
              width: "100%", 
              textAlign: "left",
              color: "#1e293b"
            }}>
              💡 {q}
            </button>
          ))}
        </div>
        
        {/* Paywall Section (Below suggestions) */}
        <div style={{
          background: "#ffffff",
          border: "1px solid #e2e8f0",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "2rem",
          textAlign: "center",
          borderRadius: "12px",
          boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)"
        }}>
          <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🔒</div>
          <h3 style={{ margin: "0 0 0.5rem 0", color: "#111827", fontSize: "1.5rem" }}>Unlock AI Doctor Chat</h3>
          <p style={{ color: "#4b5563", marginBottom: "1.5rem", maxWidth: "300px", lineHeight: "1.5" }}>
            Get unlimited, personalized medical answers from Dr. Gyan based on your exact biomarkers.
          </p>
          <button style={{
            background: "#2563eb",
            color: "white",
            padding: "12px 24px",
            border: "none",
            borderRadius: "8px",
            fontSize: "1.1rem",
            fontWeight: "bold",
            cursor: "pointer",
            boxShadow: "0 4px 6px -1px rgba(37, 99, 235, 0.4)",
            width: "100%",
            maxWidth: "250px"
          }}>
            Upgrade for ₹99
          </button>
        </div>
        
      </div>
    </div>
  );
}
