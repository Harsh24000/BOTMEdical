import { useRef, useState } from "react";
import { uploadReport } from "../api";
import type { UploadResponse } from "../types";

interface Props {
  onAnalyzed: (result: UploadResponse) => void;
}

export default function ReportUpload({ onAnalyzed }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setError(null);
    setFileName(file.name);
    setLoading(true);
    try {
      let location = "";
      try {
        const ipRes = await fetch("https://ipapi.co/json/");
        if (ipRes.ok) {
          const ipData = await ipRes.json();
          if (ipData.city && ipData.country_name) {
            location = `${ipData.city}, ${ipData.country_name}`;
          }
        }
      } catch (err) {
        console.warn("Could not fetch location:", err);
      }

      const result = await uploadReport(file, location);
      onAnalyzed(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="upload">
      <h2>Upload your lab report</h2>
      <p className="muted">PDF with selectable text (most lab-generated reports).</p>

      <div
        className="dropzone"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          const f = e.dataTransfer.files?.[0];
          if (f) handleFile(f);
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf"
          hidden
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
          }}
        />
        {loading ? (
          <span>Analyzing {fileName}… this can take a moment.</span>
        ) : (
          <span>Click to choose a PDF, or drag &amp; drop it here.</span>
        )}
      </div>

      {error && <p className="error">{error}</p>}
    </div>
  );
}
