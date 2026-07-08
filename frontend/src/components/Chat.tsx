import { useState, useRef, useEffect } from "react";
import { streamChat, PaywallError } from "../api";
import type { ChatMessage } from "../types";

interface Props {
  sessionId: string;
}

export default function Chat({ sessionId }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [locked, setLocked] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend() {
    const text = input.trim();
    if (!text || loading || locked) return;

    setError(null);
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setMessages((prev) => [...prev, { role: "assistant", content: "" }]);
    setLoading(true);

    try {
      await streamChat(sessionId, text, (chunk) => {
        setMessages((prev) => {
          const next = [...prev];
          next[next.length - 1] = {
            ...next[next.length - 1],
            content: next[next.length - 1].content + chunk,
          };
          return next;
        });
      });
      // First free exchange just completed successfully -> lock further input.
      setLocked(true);
    } catch (err) {
      if (err instanceof PaywallError) {
        setLocked(true);
        // Remove the empty assistant placeholder bubble since no answer came.
        setMessages((prev) => prev.slice(0, -1));
      } else {
        setError(err instanceof Error ? err.message : "Something went wrong.");
        setMessages((prev) => prev.slice(0, -1));
      }
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") handleSend();
  }

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
          Ask about your report. 1 free question.
        </p>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "1rem 1.25rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        {messages.length === 0 && (
          <p style={{ color: "#94a3b8", fontSize: "0.95rem", textAlign: "center", marginTop: "2rem" }}>
            Ask Dr. Gyan anything about your results.
          </p>
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
            You've used your free question. Upgrade to keep chatting with Dr. Gyan.
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
