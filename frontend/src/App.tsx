import { useState } from "react";
import ReportUpload from "./components/ReportUpload";
import AnalysisPanel from "./components/AnalysisPanel";
import Chat from "./components/Chat";
import PremiumHook from "./components/PremiumHook";
import WhyUpgradeModal from "./components/WhyUpgradeModal";
import WhyUpgradeCard from "./components/WhyUpgradeCard";
import SiteHeader from "./components/SiteHeader";
import HeroHeader from "./components/HeroHeader";
import TrackProgressCard from "./components/TrackProgressCard";
import SiteFooter from "./components/SiteFooter";
import type { UploadResponse } from "./types";

export default function App() {
  const [result, setResult] = useState<UploadResponse | null>(null);
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);

  function handleUpgradeClick() {
    // Shows the "why upgrade" video hook (WhyUpgradeModal). Its own CTA
    // still doesn't call a real payment endpoint — no gateway is wired in
    // yet. Point that button at real checkout when Stripe/Razorpay lands.
    setUpgradeModalOpen(true);
  }

  return (
    <div className="app">
      <WhyUpgradeModal open={upgradeModalOpen} onClose={() => setUpgradeModalOpen(false)} />
      <SiteHeader patientName={result?.analysis.patient_name} />

      {!result ? (
        <main className="centered">
          <ReportUpload onAnalyzed={setResult} />
          <p className="muted small disclaimer-top">
            Educational use only. This tool does not provide a medical diagnosis and is
            not a substitute for advice from a qualified healthcare professional.
          </p>
        </main>
      ) : (
        <main className="workspace">
          <section className="left">
            <div style={{ display: "flex", gap: "1.5rem", alignItems: "flex-start", flexWrap: "wrap" }}>
              <div style={{ flex: 1, minWidth: "260px" }}>
                <HeroHeader
                  patientName={result.analysis.patient_name}
                  sessionId={result.session_id}
                  biomarkerCount={result.analysis.findings.length}
                  wellnessScore={result.analysis.wellness_score}
                />
              </div>
              <TrackProgressCard onUpgrade={handleUpgradeClick} />
            </div>

            <button className="reset" onClick={() => setResult(null)}>
              ← Analyze a different report
            </button>
            <AnalysisPanel analysis={result.analysis} onUpgrade={handleUpgradeClick} />
          </section>
          <section className="right">
            <Chat
              sessionId={result.session_id}
              starterSuggestions={result.analysis.starter_suggestions}
              onUpgrade={handleUpgradeClick}
            />
            <div style={{ marginTop: "1.5rem" }}>
              <WhyUpgradeCard onUpgrade={handleUpgradeClick} />
            </div>
            <div style={{ marginTop: "1.5rem" }}>
              <PremiumHook
                previewLines={result.analysis.premium_preview}
                onUpgrade={handleUpgradeClick}
              />
            </div>
          </section>
        </main>
      )}
      <SiteFooter />
    </div>
  );
}
