import { useState } from "react";
import ReportUpload from "./components/ReportUpload";
import AnalysisPanel from "./components/AnalysisPanel";
import Chat from "./components/Chat";
import PremiumHook from "./components/PremiumHook";
import type { UploadResponse } from "./types";

export default function App() {
  const [result, setResult] = useState<UploadResponse | null>(null);

  function handleUpgradeClick() {
    // Stub — no payment provider wired in yet.
    // Replace with real checkout flow when Stripe/Razorpay is added.
    alert("Upgrade flow coming soon!");
  }

  return (
    <div className="app">
      <header>
        <h1>NirogGyan</h1>
        <p className="tagline">AI-powered lab report analysis &amp; guidance</p>
      </header>

      {!result ? (
        <main className="centered">
          <ReportUpload onAnalyzed={setResult} />
          <p className="muted small disclaimer-top">
            Educational use only. This tool does not provide a medical diagnosis and is
            not a substitute for advice from a qualified healthcare professional.
          </p>
        </main>
      ) : (
        <>
          {/*
            NOTE ON LAYOUT: PremiumHook used to live inside the sticky "right"
            sidebar alongside Chat. That caused repeated clipping issues —
            .right is position:sticky with a CSS-defined height on .chat
            (calc(100vh - 120px)), so anything stacked below Chat inside that
            same sidebar was fighting an unpredictable, viewport-dependent
            height. Moving it to a full-width section BELOW the two-column
            grid removes that entire class of bug: it's now just normal
            page content, reachable by ordinary page scroll, with nothing
            constraining or clipping it.
          */}
          <main className="workspace">
            <section className="left">
              <button className="reset" onClick={() => setResult(null)}>
                ← Analyze a different report
              </button>
              <AnalysisPanel analysis={result.analysis} />
            </section>
            <section className="right">
              <Chat
                sessionId={result.session_id}
                starterSuggestions={result.analysis.starter_suggestions}
                onUpgrade={handleUpgradeClick}
              />
            </section>
          </main>

          <div style={{ maxWidth: "1200px", margin: "20px auto 0" }}>
            <PremiumHook
              previewLines={result.analysis.premium_preview}
              onUpgrade={handleUpgradeClick}
            />
          </div>
        </>
      )}
    </div>
  );
}
