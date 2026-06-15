import { useState } from "react";
import ReportUpload from "./components/ReportUpload";
import AnalysisPanel from "./components/AnalysisPanel";
import Chat from "./components/Chat";
import type { UploadResponse } from "./types";

export default function App() {
  const [result, setResult] = useState<UploadResponse | null>(null);

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
        <main className="workspace">
          <section className="left">
            <button className="reset" onClick={() => setResult(null)}>
              ← Analyze a different report
            </button>
            <AnalysisPanel analysis={result.analysis} />
          </section>
          <section className="right">
            <Chat sessionId={result.session_id} />
          </section>
        </main>
      )}
    </div>
  );
}
