import { useState, useRef, useEffect } from "react";
import { streamChat, PaywallError } from "../api";
import type { ChatMessage } from "../types";

interface Props {
  sessionId: string;
  starterSuggestions: string[];
}

// 5 credits = 1 question. Asking a question consumes the full balance,
// so this is functionally the same 1-free-question gate as before, just
// relabeled for future monetization (e.g. upgrade grants more credits).
const TOTAL_CREDITS: number = 5;

export default function Chat({ sessionId, starterSuggestions }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [locked, setLocked] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const creditsLeft = locked ? 0 : TOTAL_CREDITS;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage(text: string) {
    const trimmed = text.trim();
    if (!trimmed || loading || locked) return;

    setError(null);
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: trimmed }]);
    setMessages((prev) => [...prev, { role: "assistant", content: "" }]);
    setLoading(true);

    try {
      await streamChat(sessionId, trimmed, (chunk) => {
        setMessages((prev) => {
          const next = [...prev];
          next[next.length - 1] = {
            ...next[next.length - 1],
            content: next[next.length - 1].content + chunk,
          };
          return next;
        });
      });
      // 1 question = all 5 credits. Same gate as before, just relabeled.
      setLocked(true);
    } catch (err) {
      if (err instanceof PaywallError) {
        setLocked(true);
        setMessages((prev) => prev.slice(0, -1));
      } else {
        setError(err instanceof Error ? err.message : "Something went wrong.");
        setMessages((prev) => prev.slice(0, -1));
      }
    } finally {
      setLoading(false);
    }
  }

  function handleSend() {
    sendMessage(input);
  }

  function handleSuggestionClick(suggestion: string) {
    sendMessage(suggestion);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") handleSend();
  }

  const showSuggestions = messages.length === 0 && !locked && starterSuggestions.length > 0;

  return (
    <div
      className="chat"
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        background: "#ffffff",
        border: "1px solid #e2e8f0",
        borderRadius: "16px",
        boxShadow: "0 10px 25px -5px rgba(0,0,0,0.05)",
        overflow: "hidden",
      }}
    >
      <div style={{ padding: "1rem 1.25rem", borderBottom: "1px solid #e2e8f0" }}>
        <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 800, color: "#111827" }}>
          🩺 Chat with Dr. Gyan
        </h3>
        <p style={{ margin: "0.25rem 0 0 0", fontSize: "0.85rem", color: "#64748b" }}>
          {creditsLeft} credit{creditsLeft === 1 ? "" : "s"} left
        </p>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "1rem 1.25rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        {messages.length === 0 && !showSuggestions && (
          <p style={{ color: "#94a3b8", fontSize: "0.95rem", textAlign: "center", marginTop: "2rem" }}>
            Ask Dr. Gyan anything about your results.
          </p>
        )}

        {showSuggestions && (
          <div style={{ marginTop: "1rem" }}>
            <p style={{ color: "#94a3b8", fontSize: "0.85rem", textAlign: "center", marginBottom: "0.75rem" }}>
              Based on your report, you might want to ask:
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {starterSuggestions.map((s, i) => (
                <button
                  key={i}
                  onClick={() => handleSuggestionClick(s)}
                  disabled={loading}
                  style={{
                    textAlign: "left",
                    background: "#f8fafc",
                    border: "1px solid #e2e8f0",
                    borderRadius: "10px",
                    padding: "0.6rem 0.9rem",
                    fontSize: "0.9rem",
                    color: "#334155",
                    cursor: loading ? "default" : "pointer",
                  }}
                  onMouseOver={(e) => (e.currentTarget.style.background = "#f1f5f9")}
                  onMouseOut={(e) => (e.currentTarget.style.background = "#f8fafc")}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <div
            key={i}
            style={{
              alignSelf: m.role === "user" ? "flex-end" : "flex-start",
              background: m.role === "user" ? "#2563eb" : "#f1f5f9",
              color: m.role === "user" ? "#ffffff" : "#1e293b",
              padding: "0.65rem 1rem",
              borderRadius: "14px",
              maxWidth: "85%",
              fontSize: "0.95rem",
              lineHeight: 1.5,
              whiteSpace: "pre-wrap",
            }}
          >
            {m.content || (loading && i === messages.length - 1 ? "…" : "")}
          </div>
        ))}
        {error && (
          <div style={{ color: "#dc2626", fontSize: "0.85rem", textAlign: "center" }}>{error}</div>
        )}
        <div ref={bottomRef} />
      </div>

      {!locked ? (
        <div style={{ display: "flex", gap: "0.5rem", padding: "0.75rem", borderTop: "1px solid #e2e8f0" }}>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about your results..."
            disabled={loading}
            style={{
              flex: 1,
              padding: "0.65rem 0.9rem",
              borderRadius: "10px",
              border: "1px solid #cbd5e1",
              fontSize: "0.95rem",
              outline: "none",
            }}
          />
          <button
            onClick={handleSend}
            disabled={loading || !input.trim()}
            style={{
              background: "#2563eb",
              color: "white",
              border: "none",
              borderRadius: "10px",
              padding: "0 1.1rem",
              fontWeight: 700,
              cursor: loading ? "default" : "pointer",
              opacity: loading || !input.trim() ? 0.6 : 1,
            }}
          >
            Send
          </button>
        </div>
      ) : (
        <div
          style={{
            padding: "1.5rem",
            borderTop: "1px solid #e2e8f0",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
            gap: "0.75rem",
          }}
        >
          <p style={{ margin: 0, color: "#475569", fontSize: "0.95rem" }}>
            You're out of credits. Upgrade to keep chatting with Dr. Gyan.
          </p>
          <button
            style={{
              background: "linear-gradient(135deg, #2563eb, #3b82f6)",
              color: "white",
              padding: "12px 28px",
              border: "none",
              borderRadius: "8px",
              fontSize: "1rem",
              fontWeight: "bold",
              cursor: "pointer",
              boxShadow: "0 10px 15px -3px rgba(37, 99, 235, 0.3)",
              width: "100%",
              maxWidth: "280px",
            }}
          >
            Upgrade for ₹99
          </button>
        </div>
      )}
    </div>
  );
}
