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

// Fallback for Safari/Chrome support
const SpeechRecognition = 
  (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

export default function Chat({ sessionId }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // 🎤 1. VOICE INPUT: Listen to the user's voice
  function startListening() {
    if (!SpeechRecognition) {
      alert("Your browser does not support Voice Input. Please use Google Chrome.");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    
    recognition.onstart = () => setIsListening(true);
    
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript); // Automatically fill the input box with their words!
      setIsListening(false);
    };
    
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
    
    recognition.start();
  }

  // 🗣️ 2. VOICE OUTPUT: Read Dr. Gyan's answer out loud
  function speakText(text: string) {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel(); // Stop any ongoing speech
      
      // Clean up text (remove markdown formatting and the button text)
      const cleanText = text
        .split("|SUGGESTIONS|")[0] 
        .replace(/[\*\#\_]/g, '') 
        .trim();
        
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.lang = "en-US";
      utterance.rate = 1.0; // Normal speaking speed
      window.speechSynthesis.speak(utterance);
    }
  }

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || busy) return;

    setInput("");
    setBusy(true);
    
    // Stop speaking if the user sends a new message
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }

    setMessages((m) => [
      ...m,
      { role: "user", content: trimmed },
      { role: "assistant", content: "" },
    ]);

    let fullResponse = "";

    try {
      await streamChat(sessionId, trimmed, (chunk) => {
        fullResponse += chunk; // Collect the text as it streams in
        setMessages((m) => {
          const next = [...m];
          next[next.length - 1] = {
            role: "assistant",
            content: next[next.length - 1].content + chunk,
          };
          return next;
        });
      });
      
      // Speak the final answer out loud!
      speakText(fullResponse);
      
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

  function renderMessage(content: string, isLast: boolean) {
    if (!content) return busy && isLast ? "…" : "";
    
    if (content.includes("|SUGGESTIONS|")) {
      const parts = content.split("|SUGGESTIONS|");
      const textPart = parts[0].trim();
      const suggestionsPart = parts[1] ? parts[1].trim() : "";
      
      const suggestions = suggestionsPart
        .split("\n")
        .map((s) => s.trim().replace(/^-\s*/, '').replace(/^\d+\.\s*/, ''))
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
            <div className="msg-role">{m.role === "user" ? "You" : "Dr. Gyan"}</div>
            <div className="msg-content">
              {renderMessage(m.content, i === messages.length - 1)}
            </div>
          </div>
        ))}
        <div ref={endRef} />
      </div>

      <form
        className="composer"
        style={{ display: "flex", gap: "8px", alignItems: "center" }}
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
      >
        {/* The New Microphone Button */}
        <button 
          type="button" 
          onClick={startListening}
          disabled={busy}
          title="Click to speak"
          style={{
            background: isListening ? "#ef4444" : "#e5e7eb",
            color: isListening ? "white" : "#374151",
            border: "none",
            borderRadius: "50%",
            width: "42px",
            height: "42px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            fontSize: "1.2rem",
            flexShrink: 0,
            animation: isListening ? "pulse 1.5s infinite" : "none"
          }}
        >
          🎤
        </button>

        <input
          value={input}
          placeholder={isListening ? "Listening... Speak now" : "Type or speak your question…"}
          onChange={(e) => setInput(e.target.value)}
          disabled={busy || isListening}
          style={{ flexGrow: 1 }}
        />
        <button type="submit" disabled={busy || !input.trim()}>
          {busy ? "…" : "Send"}
        </button>
      </form>

      {/* Animation for the pulsating red microphone */}
      <style>{`
        @keyframes pulse {
          0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); }
          70% { box-shadow: 0 0 0 10px rgba(239, 68, 68, 0); }
          100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
        }
      `}</style>
    </div>
  );
}
