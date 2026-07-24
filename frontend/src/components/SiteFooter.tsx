import LogoMark from "./LogoMark";

export default function SiteFooter() {
  const columns = [
    { title: "Product", links: ["Pricing", "Features"] },
    { title: "Resources", links: ["Medical Library", "Data Security"] },
    { title: "Legal", links: ["Privacy Policy", "Terms"] },
  ];

  return (
    <footer
      style={{
        background: "#0f1a3d",
        color: "#cbd5e1",
        padding: "2.5rem 1.5rem",
        marginTop: "3rem",
        display: "flex",
        flexWrap: "wrap",
        justifyContent: "space-between",
        gap: "2rem",
      }}
    >
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#ffffff", fontWeight: 800, fontSize: "1.1rem" }}>
          <LogoMark size={22} />
          Niro Health
        </div>
        <p style={{ margin: "0.4rem 0 0 0", fontSize: "0.8rem", color: "#94a3b8" }}>
          © {new Date().getFullYear()} Niro Health. Educational use only.
        </p>
      </div>

      <div style={{ display: "flex", gap: "2.5rem" }}>
        {columns.map((col) => (
          <div key={col.title}>
            <div style={{ color: "#ffffff", fontWeight: 700, fontSize: "0.85rem", marginBottom: "0.6rem" }}>
              {col.title}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.45rem" }}>
              {/* Placeholder links — these pages don't exist yet, point them
                  at real routes before this footer ships to production */}
              {col.links.map((link) => (
                <a key={link} href="#" style={{ color: "#94a3b8", fontSize: "0.8rem", textDecoration: "none" }}>
                  {link}
                </a>
              ))}
            </div>
          </div>
        ))}
      </div>
    </footer>
  );
}
