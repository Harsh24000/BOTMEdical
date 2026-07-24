interface Props {
  patientName?: string;
}

/** Avatar with initials — no photo upload exists yet, so this stands in
 * for the user's photo in the reference design. */
function InitialsAvatar({ name }: { name: string }) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("") || "?";
  return (
    <div
      style={{
        width: "34px",
        height: "34px",
        borderRadius: "999px",
        background: "#2563eb",
        color: "#ffffff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "0.8rem",
        fontWeight: 800,
        flexShrink: 0,
      }}
    >
      {initials}
    </div>
  );
}

export default function SiteHeader({ patientName }: Props) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "1rem 1.5rem",
        borderBottom: "1px solid #e2e8f0",
        background: "#ffffff",
      }}
    >
      <div style={{ fontWeight: 800, fontSize: "1.25rem", color: "#111827" }}>NirogGyan</div>

      <nav style={{ display: "flex", alignItems: "center", gap: "1.75rem" }}>
        {/* Placeholder links — point these at real sections/pages before launch */}
        <a href="#" style={{ color: "#334155", fontSize: "0.9rem", textDecoration: "none" }}>
          Features
        </a>
        <a href="#" style={{ color: "#334155", fontSize: "0.9rem", textDecoration: "none" }}>
          FAQ
        </a>
        <a
          href="#"
          style={{
            background: "#0f1a3d",
            color: "#ffffff",
            fontSize: "0.85rem",
            fontWeight: 700,
            textDecoration: "none",
            padding: "0.5rem 1.1rem",
            borderRadius: "999px",
          }}
        >
          For Labs &amp; Hospitals
        </a>

        {patientName && (
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span style={{ color: "#334155", fontSize: "0.9rem", fontWeight: 600 }}>
              {patientName.split(/\s+/)[0]}
            </span>
            <InitialsAvatar name={patientName} />
          </div>
        )}
      </nav>
    </div>
  );
}
