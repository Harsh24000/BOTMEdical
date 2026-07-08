import type { Finding } from "../types";

interface Props {
  findings: Finding[];
}

export default function HealthCard({ findings }: Props) {
  const total = findings.length;
  const abnormal = findings.filter((f) => f.status === "abnormal").length;
  const normal = total - abnormal;

  // Guard against a report where findings didn't come through for some reason.
  if (total === 0) {
    return null;
  }

  const normalPct = Math.round((normal / total) * 100);

  return (
    <div
      style={{
        background: "#ffffff",
        border: "1px solid #e2e8f0",
        borderRadius: "12px",
        padding: "1.25rem 1.5rem",
        marginBottom: "2rem",
        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.03)",
      }}
    >
      <h3
        style={{
          margin: "0 0 1rem 0",
          fontSize: "0.95rem",
          fontWeight: 700,
          color: "#64748b",
          textTransform: "uppercase",
          letterSpacing: "0.05em",
        }}
      >
        Health Snapshot
      </h3>

      <div style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
        <div style={{ display: "flex", gap: "2rem" }}>
          <div>
            <div style={{ fontSize: "2rem", fontWeight: 800, color: "#16a34a", lineHeight: 1 }}>
              {normal}
            </div>
            <div style={{ fontSize: "0.85rem", color: "#64748b", marginTop: "0.25rem" }}>Normal</div>
          </div>
          <div>
            <div style={{ fontSize: "2rem", fontWeight: 800, color: "#dc2626", lineHeight: 1 }}>
              {abnormal}
            </div>
            <div style={{ fontSize: "0.85rem", color: "#64748b", marginTop: "0.25rem" }}>Abnormal</div>
          </div>
          <div>
            <div style={{ fontSize: "2rem", fontWeight: 800, color: "#334155", lineHeight: 1 }}>
              {total}
            </div>
            <div style={{ fontSize: "0.85rem", color: "#64748b", marginTop: "0.25rem" }}>Tests</div>
          </div>
        </div>
      </div>

      <div
        style={{
          marginTop: "1rem",
          height: "8px",
          borderRadius: "999px",
          background: "#fee2e2",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${normalPct}%`,
            background: "#16a34a",
            borderRadius: "999px",
            transition: "width 0.3s ease",
          }}
        />
      </div>
    </div>
  );
}
