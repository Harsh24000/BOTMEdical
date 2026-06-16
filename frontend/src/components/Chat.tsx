import { useEffect, useRef, useState } from "react";
import { streamChat } from "../api";
import type { ChatMessage } from "../types";

interface Props {
  sessionId: string;
}

const SUGGESTIONS = [
  "What are my biggest health risks based on this report?",
  "Which results should I be most concerned about, and why?",
  "What lifestyle changes could help improve these numbers?",
];

export default function Chat({ sessionId }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || busy) return;

    setInput("");
    setBusy(true);
    setMessages((m) => [
      ...m,
      { role: "user", content: trimmed },
      { role: "assistant", content: "" },
    ]);

    try {
      await streamChat(sessionId, trimmed, (chunk) => {
        setMessages((m) => {
          const next = [...m];
          next[next.length - 1] = {
            role: "assistant",
            content: next[next.length - 1].content + chunk,
          };
          return next;
        });
      });
    } catch (e) {
      setMessages((m) => {
        const next = [...m];
        next[next.length - 1] = {
          role: "assistant",
          content: `Sorry, something went wrong: ${
            e instanceof Error ? e.message : "unknown error"
          }`,
        };
        return next;
      });
    } finally {
      setBusy(false);
    }
  }

  // Parses the response and renders clickable buttons for suggestions
  function renderMessage(content: string, isLast: boolean) {
    if (!content) return busy && isLast ? "…" : "";
    
    if (content.includes("|SUGGESTIONS|")) {
      const parts = content.split("|SUGGESTIONS|");
      const textPart = parts[0].trim();
      const suggestionsPart = parts[1] ? parts[1].trim() : "";
      
      const suggestions = suggestionsPart
        .split("\n")
        .map((s) => s.trim().replace(/^-\s*/, '').replace(/^\d+\.\s*/, '')) // clean up formatting
        .filter((s) => s.length > 0);

      return (
        <>
          <div style={{ whiteSpace: "pre-wrap" }}>{textPart}</div>
          {suggestions.length > 0 && (
            <div className="dynamic-suggestions" style={{ marginTop: "1rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {suggestions.map((s, idx) => (
                <button 
                  key={idx} 
                  onClick={() => send(s)} 
                  disabled={busy}
                  style={{
                    textAlign: "left",
                    padding: "10px 14px",
                    background: "#f0fdf4",
                    border: "1px solid #bbf7d0",
                    borderRadius: "8px",
                    color: "#166534",
                    cursor: "pointer",
                    fontWeight: 500,
                    transition: "all 0.2s"
                  }}
                >
                  💡 {s}
                </button>
              ))}
            </div>
          )}
        </>
      );
    }

    return <div style={{ whiteSpace: "pre-wrap" }}>{content}</div>;
  }

  return (
    <div className="chat">
      <h2>Ask about your results</h2>

      <div className="messages">
        {messages.length === 0 && (
          <div className="suggestions">
            <p className="muted">Try asking:</p>
            {SUGGESTIONS.map((s) => (
              <button key={s} onClick={() => send(s)} disabled={busy}>
                {s}
              </button>
            ))}
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} className={`msg msg-${m.role}`}>
            <div className="msg-role">{m.role === "user" ? "You" : "NirogGyan"}</div>
            <div className="msg-content">
              {renderMessage(m.content, i === messages.length - 1)}
            </div>
          </div>
        ))}
        <div ref={endRef} />
      </div>

      <form
        className="composer"
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
      >
        <input
          value={input}
          placeholder="Ask about your risks, results, or next steps…"
          onChange={(e) => setInput(e.target.value)}
          disabled={busy}
        />
        <button type="submit" disabled={busy || !input.trim()}>
          {busy ? "…" : "Send"}
        </button>
      </form>
    </div>
  );
}
