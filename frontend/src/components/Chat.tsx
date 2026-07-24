import { useState, useRef, useEffect } from "react";
import { streamChat, PaywallError } from "../api";
import type { ChatMessage } from "../types";

interface Props {
  sessionId: string;
  starterSuggestions: string[];
  onUpgrade: () => void;
}

// 5 credits = 1 question. Asking a question consumes the full balance,
// so this is functionally the same 1-free-question gate as before, just
// relabeled for future monetization (e.g. upgrade grants more credits).
const TOTAL_CREDITS: number = 5;

const SUGGESTIONS_MARKER = "|SUGGESTIONS|";

/** Splits Dr. Gyan's raw reply into the answer text and its follow-up
 * suggestion lines, so the marker never renders as literal text. */
function parseAssistantMessage(content: string): { text: string; suggestions: string[] } {
  const idx = content.indexOf(SUGGESTIONS_MARKER);
  if (idx === -1) {
    return { text: content, suggestions: [] };
  }
  const text = content.slice(0, idx).trim();
  const suggestions = content
    .slice(idx + SUGGESTIONS_MARKER.length)
    .split("\n")
    .map((s) => s.replace(/^[-*\d.\s]+/, "").trim())
    .filter(Boolean);
  return { text, suggestions };
}

export default function Chat({ sessionId, starterSuggestions, onUpgrade }: Props) {
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
      {/* Premium-styled header: dark navy, avatar, online status, credits badge */}
      <div
        style={{
          background: "#0f1a3d",
          padding: "0.9rem 1.1rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "0.75rem",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.65rem" }}>
          <div
            style={{
              width: "38px",
              height: "38px",
              borderRadius: "999px",
              background: "#ffffff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "1.15rem",
              flexShrink: 0,
            }}
          >
            🩺
          </div>
          <div>
            <div style={{ color: "#ffffff", fontWeight: 800, fontSize: "0.95rem", lineHeight: 1.2 }}>
              Dr. Gyan AI
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
              <span style={{ width: "6px", height: "6px", borderRadius: "999px", background: "#34d399" }} />
              <span style={{ color: "#86efac", fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.03em" }}>
                Online
              </span>
            </div>
          </div>
        </div>

        <div style={{ textAlign: "right" }}>
          <div style={{ color: "#94a3b8", fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.05em" }}>
            CREDITS LEFT
          </div>
          <div style={{ color: "#ffffff", fontWeight: 800, fontSize: "0.9rem" }}>{creditsLeft}</div>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "1rem 1.25rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        {messages.length === 0 && !showSuggestions && (
          <p style={{ color: "#94a3b8", fontSize: "0.95rem", textAlign: "center", marginTop: "2rem" }}>
            Ask Dr. Gyan anything about your results.
          </p>
        )}

        {showSuggestions && (
          <div style={{ marginTop: "1rem" }}>
            <p style={{ color: "#94a3b8", fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.05em", marginBottom: "0.6rem" }}>
              TRY ASKING:
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {starterSuggestions.map((s, i) => (
                <button
                  key={i}
                  onClick={() => handleSuggestionClick(s)}
                  disabled={loading}
                  style={{
                    textAlign: "left",
                    background: "#ffffff",
                    border: "1px solid #bfdbfe",
                    borderRadius: "10px",
                    padding: "0.6rem 0.9rem",
                    fontSize: "0.88rem",
                    color: "#1d4ed8",
                    fontStyle: "italic",
                    cursor: loading ? "default" : "pointer",
                  }}
                  onMouseOver={(e) => (e.currentTarget.style.background = "#eff6ff")}
                  onMouseOut={(e) => (e.currentTarget.style.background = "#ffffff")}
                >
                  "{s}"
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) => {
          if (m.role === "user") {
            return (
              <div
                key={i}
                style={{
                  alignSelf: "flex-end",
                  background: "#2563eb",
                  color: "#ffffff",
                  padding: "0.65rem 1rem",
                  borderRadius: "14px",
                  maxWidth: "85%",
                  fontSize: "0.95rem",
                  lineHeight: 1.5,
                  whiteSpace: "pre-wrap",
                }}
              >
                {m.content}
              </div>
            );
          }

          const { text, suggestions } = parseAssistantMessage(m.content);
          const isStreamingThisMessage = loading && i === messages.length - 1;

          return (
            <div key={i} style={{ display: "flex", flexDirection: "column", gap: "0.5rem", alignSelf: "flex-start", maxWidth: "85%" }}>
              <div
                style={{
                  background: "#f1f5f9",
                  color: "#1e293b",
                  padding: "0.65rem 1rem",
                  borderRadius: "14px",
                  fontSize: "0.95rem",
                  lineHeight: 1.5,
                  whiteSpace: "pre-wrap",
                }}
              >
                {text || (isStreamingThisMessage ? "…" : "")}
              </div>

              {suggestions.length > 0 && !isStreamingThisMessage && (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                  {suggestions.map((s, si) => (
                    <button
                      key={si}
                      onClick={() => (locked ? onUpgrade() : sendMessage(s))}
                      style={{
                        textAlign: "left",
                        background: locked ? "#f8fafc" : "#eff6ff",
                        border: `1px dashed ${locked ? "#cbd5e1" : "#93c5fd"}`,
                        borderRadius: "10px",
                        padding: "0.5rem 0.8rem",
                        fontSize: "0.85rem",
                        color: locked ? "#94a3b8" : "#1d4ed8",
                        cursor: "pointer",
                      }}
                    >
                      {locked ? "🔒 " : ""}
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
        {error && (
          <div style={{ color: "#dc2626", fontSize: "0.85rem", textAlign: "center" }}>{error}</div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Refill banner — only shown once credits are used up, sits above the input like the reference */}
      {locked && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "#eff6ff",
            borderTop: "1px solid #dbeafe",
            padding: "0.65rem 1.1rem",
            fontSize: "0.85rem",
          }}
        >
          <span style={{ color: "#334155" }}>Run out of credits?</span>
          <button
            onClick={onUpgrade}
            style={{
              background: "none",
              border: "none",
              color: "#1d4ed8",
              fontWeight: 700,
              textDecoration: "underline",
              cursor: "pointer",
              fontSize: "0.85rem",
              padding: 0,
            }}
          >
            Refill Credits
          </button>
        </div>
      )}

      <div style={{ display: "flex", gap: "0.5rem", padding: "0.75rem", borderTop: locked ? "none" : "1px solid #e2e8f0" }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={locked ? "Ask Dr. Gyan anything..." : "Ask about your results..."}
          disabled={loading || locked}
          style={{
            flex: 1,
            padding: "0.65rem 0.9rem",
            borderRadius: "10px",
            border: "1px solid #cbd5e1",
            fontSize: "0.95rem",
            outline: "none",
            background: locked ? "#f8fafc" : "#ffffff",
            color: locked ? "#94a3b8" : "#0f172a",
          }}
        />
        <button
          onClick={locked ? onUpgrade : handleSend}
          disabled={locked ? false : loading || !input.trim()}
          style={{
            background: "#2563eb",
            color: "white",
            border: "none",
            borderRadius: "10px",
            padding: "0 1.1rem",
            fontWeight: 700,
            cursor: "pointer",
            opacity: locked ? 1 : loading || !input.trim() ? 0.6 : 1,
          }}
        >
          {locked ? "→" : "Send"}
        </button>
      </div>
      <p style={{ margin: "0 0 0.75rem 0", fontSize: "0.68rem", color: "#94a3b8", textAlign: "center" }}>
        Disclaimer: For informational purposes only.
      </p>
    </div>
  );
}
