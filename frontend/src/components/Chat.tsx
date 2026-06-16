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

const SpeechRecognition = 
  (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

export default function Chat({ sessionId }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [speakingIndex, setSpeakingIndex] = useState<number | null>(null); // Tracks which message is playing
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Load High-Quality Voices in advance
  useEffect(() => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.getVoices();
      };
    }
  }, []);

  // 🎤 Voice Input
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
      setInput(event.results[0][0].transcript);
      setIsListening(false);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
    recognition.start();
  }

  // 🔊 Play/Stop High-Quality Voice
  function toggleSpeech(text: string, index: number) {
    if (!("speechSynthesis" in window)) return;

    // If already playing this message, STOP it
    if (speakingIndex === index) {
      window.speechSynthesis.cancel();
      setSpeakingIndex(null);
      return;
    }

    // Stop anything else that might be playing
    window.speechSynthesis.cancel();
    
    const cleanText = text.replace(/[\*\#\_]/g, '').trim();
    const utterance = new SpeechSynthesisUtterance(cleanText);
    
    // Search for the most natural sounding premium voices installed on the device
    const voices = window.speechSynthesis.getVoices();
    const premiumVoice = voices.find(v => 
      v.name.includes("Google US English") || 
      v.name.includes("Google UK English Female") || 
      v.name.includes("Samantha") || 
      v.name.includes("Premium") || 
      v.name.includes("Natural")
    ) || voices.find(v => v.lang.startsWith("en-")) || voices[0];
      
    if (premiumVoice) {
      utterance.voice = premiumVoice;
    }
    
    // Tweak pitch and speed to sound more human
    utterance.rate = 1.0;
    utterance.pitch = 1.05; 
    
    utterance.onend = () => setSpeakingIndex(null);
    utterance.onerror = () => setSpeakingIndex(null);
    
    setSpeakingIndex(index);
    window.speechSynthesis.speak(utterance);
  }

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || busy) return;

    setInput("");
    setBusy(true);
    
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      setSpeakingIndex(null);
    }

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
          content: `Sorry, something went wrong: ${e instanceof Error ? e.message : "unknown error"}`,
        };
        return next;
      });
    } finally {
      setBusy(false);
    }
  }

  // Renders the message text, the play/stop button, and the suggestions
  function renderMessage(content: string, isLast: boolean, index: number, role: string) {
    if (!content) return busy && isLast ? "…" : "";
    
    let textPart = content;
    let suggestions: string[] = [];
    
    if (content.includes("|SUGGESTIONS|")) {
      const parts = content.split("|SUGGESTIONS|");
      textPart = parts[0].trim();
      suggestions = (parts[1] ? parts[1].trim() : "")
        .split("\n")
        .map((s) => s.trim().replace(/^-\s*/, '').replace(/^\d+\.\s*/, ''))
        .filter((s) => s.length > 0);
    }

    return (
      <div style={{ position: "relative" }}>
        
        {/* Play/Stop Button - Only for AI responses */}
        {role === "assistant" && textPart.length > 0 && !busy && (
          <button
            onClick={() => toggleSpeech(textPart, index)}
            title={speakingIndex === index ? "Stop speaking" : "Listen aloud"}
            style={{
              position: "absolute",
              top: "-8px",
              right: "-8px",
              background: speakingIndex === index ? "#fee2e2" : "#f3f4f6",
              border: "none",
              borderRadius: "50%",
              cursor: "pointer",
              fontSize: "1rem",
              width: "32px",
              height: "32px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: speakingIndex === index ? "#ef4444" : "#6b7280",
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
              transition: "all 0.2s"
            }}
          >
            {speakingIndex === index ? "⏹" : "🔊"}
          </button>
        )}

        <div style={{ whiteSpace: "pre-wrap", paddingRight: role === "assistant" ? "25px" : "0" }}>
          {textPart}
        </div>

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
      </div>
    );
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
              {renderMessage(m.content, i === messages.length - 1, i, m.role)}
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
