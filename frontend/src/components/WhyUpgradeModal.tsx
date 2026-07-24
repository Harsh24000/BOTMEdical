import { useEffect, useState } from "react";

interface Props {
  open: boolean;
  onClose: () => void;
}

/**
 * The "why upgrade" hook. Shown when the user taps any Upgrade CTA in the
 * free app (paywall in Chat.tsx, the blurred PremiumHook, etc).
 *
 * VIDEO SLOT: drop the AI-generated hook video at
 *   frontend/public/media/why-upgrade.mp4
 * (plus an optional poster frame at frontend/public/media/why-upgrade.jpg)
 * and it will play automatically. Nothing else needs to change — if the
 * file is missing or fails to load, onError below swaps in the animated
 * feature carousel so the modal never shows a broken player.
 */
const VIDEO_SRC = "/media/why-upgrade.mp4";
const POSTER_SRC = "/media/why-upgrade.jpg";

const FEATURES = [
  {
    icon: "📊",
    title: "Full Visual Dashboard",
    body: "Every result plotted and grouped by panel — not just a normal/abnormal count.",
  },
  {
    icon: "👨‍👩‍👧",
    title: "Family Profiles",
    body: "Track reports for your parents, spouse, and kids from one account.",
  },
  {
    icon: "📈",
    title: "History & Trends",
    body: "See how each marker moves across every report you've ever uploaded, not just this one.",
  },
  {
    icon: "🩺",
    title: "Full Smart Report",
    body: "The complete clinical analysis behind the free preview, plus unlimited questions for Dr. Gyan.",
  },
];

export default function WhyUpgradeModal({ open, onClose }: Props) {
  const [videoFailed, setVideoFailed] = useState(false);
  const [activeFeature, setActiveFeature] = useState(0);

  // Auto-rotate the fallback carousel only while it's actually the thing on screen.
  useEffect(() => {
    if (!open || !videoFailed) return;
    const id = setInterval(() => {
      setActiveFeature((i) => (i + 1) % FEATURES.length);
    }, 3200);
    return () => clearInterval(id);
  }, [open, videoFailed]);

  // Reset state each time the modal is reopened so a fixed video isn't
  // permanently stuck showing the fallback from a previous open.
  useEffect(() => {
    if (open) {
      setVideoFailed(false);
      setActiveFeature(0);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Why upgrade to Premium"
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(15, 23, 42, 0.6)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1.5rem",
        zIndex: 1000,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#ffffff",
          borderRadius: "20px",
          maxWidth: "560px",
          width: "100%",
          maxHeight: "90vh",
          overflowY: "auto",
          boxShadow: "0 25px 50px -12px rgba(0,0,0,0.35)",
          position: "relative",
        }}
      >
        <button
          onClick={onClose}
          aria-label="Close"
          style={{
            position: "absolute",
            top: "0.85rem",
            right: "0.85rem",
            background: "rgba(15,23,42,0.06)",
            border: "none",
            borderRadius: "999px",
            width: "32px",
            height: "32px",
            fontSize: "1rem",
            color: "#334155",
            cursor: "pointer",
            zIndex: 2,
          }}
        >
          ✕
        </button>

        {/* --- Video slot / animated fallback --- */}
        <div
          style={{
            width: "100%",
            aspectRatio: "16 / 9",
            background: "#0f172a",
            borderRadius: "20px 20px 0 0",
            overflow: "hidden",
            position: "relative",
          }}
        >
          {!videoFailed ? (
            <video
              key={VIDEO_SRC}
              src={VIDEO_SRC}
              poster={POSTER_SRC}
              autoPlay
              muted
              loop
              playsInline
              controls
              onError={() => setVideoFailed(true)}
              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
            />
          ) : (
            <div
              style={{
                width: "100%",
                height: "100%",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.6rem",
                padding: "1.5rem",
                textAlign: "center",
              }}
            >
              {FEATURES.map((f, i) => (
                <div
                  key={f.title}
                  style={{
                    position: "absolute",
                    inset: 0,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "0.6rem",
                    padding: "1.5rem",
                    opacity: i === activeFeature ? 1 : 0,
                    transition: "opacity 0.6s ease",
                  }}
                >
                  <div style={{ fontSize: "2.75rem" }}>{f.icon}</div>
                  <div style={{ color: "#ffffff", fontSize: "1.2rem", fontWeight: 800 }}>{f.title}</div>
                  <div style={{ color: "#cbd5e1", fontSize: "0.9rem", maxWidth: "360px", lineHeight: 1.5 }}>
                    {f.body}
                  </div>
                </div>
              ))}
              <div style={{ position: "absolute", bottom: "1rem", display: "flex", gap: "0.4rem" }}>
                {FEATURES.map((f, i) => (
                  <span
                    key={f.title}
                    style={{
                      width: "6px",
                      height: "6px",
                      borderRadius: "999px",
                      background: i === activeFeature ? "#60a5fa" : "rgba(255,255,255,0.3)",
                      transition: "background 0.3s ease",
                    }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* --- Copy + feature list + CTA --- */}
        <div style={{ padding: "1.75rem" }}>
          <h2 style={{ margin: "0 0 0.35rem 0", fontSize: "1.4rem", fontWeight: 800, color: "#111827" }}>
            One report only shows so much.
          </h2>
          <p style={{ margin: "0 0 1.25rem 0", color: "#64748b", fontSize: "0.95rem" }}>
            Premium turns this into an ongoing health record for you and your family.
          </p>

          <div style={{ display: "grid", gap: "0.75rem", marginBottom: "1.5rem" }}>
            {FEATURES.map((f) => (
              <div key={f.title} style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start" }}>
                <div
                  style={{
                    fontSize: "1.3rem",
                    background: "#eff6ff",
                    borderRadius: "10px",
                    width: "40px",
                    height: "40px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  {f.icon}
                </div>
                <div>
                  <div style={{ fontWeight: 700, color: "#1e293b", fontSize: "0.95rem" }}>{f.title}</div>
                  <div style={{ color: "#64748b", fontSize: "0.85rem", lineHeight: 1.4 }}>{f.body}</div>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={onClose}
            style={{
              width: "100%",
              background: "linear-gradient(135deg, #2563eb, #3b82f6)",
              color: "white",
              padding: "0.85rem 1.5rem",
              border: "none",
              borderRadius: "10px",
              fontSize: "1rem",
              fontWeight: 700,
              cursor: "pointer",
              boxShadow: "0 10px 15px -3px rgba(37, 99, 235, 0.3)",
            }}
          >
            Unlock Premium — ₹99
          </button>
          <p style={{ margin: "0.6rem 0 0 0", fontSize: "0.75rem", color: "#94a3b8", textAlign: "center" }}>
            Secure payment · Cancel anytime
          </p>
        </div>
      </div>
    </div>
  );
}
