import type { ReactNode } from "react";

/** Simple inline stroke icons — no icon library dependency, matches the
 * clean minimal-line look in the reference. */
function Icon({ children }: { children: ReactNode }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      {children}
    </svg>
  );
}

const ICONS = {
  dashboard: (
    <Icon>
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </Icon>
  ),
  reports: (
    <Icon>
      <path d="M6 2.5h9l3 3v16H6z" />
      <path d="M9 12h6M9 16h6" />
    </Icon>
  ),
  trends: (
    <Icon>
      <path d="M3 17l6-6 4 4 8-8" />
      <path d="M15 7h6v6" />
    </Icon>
  ),
  family: (
    <Icon>
      <circle cx="8" cy="8" r="3" />
      <circle cx="17" cy="9" r="2.5" />
      <path d="M2 21c0-3.5 2.7-6 6-6s6 2.5 6 6" />
      <path d="M14.5 15.2c2.4.4 4.5 2.3 4.5 5.3" />
    </Icon>
  ),
  menu: (
    <Icon>
      <path d="M3 6h18M3 12h18M3 18h18" />
    </Icon>
  ),
  settings: (
    <Icon>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 13a7.97 7.97 0 000-2l2-1.6-2-3.4-2.4 1a8 8 0 00-1.7-1L15 3h-4l-.3 2.4a8 8 0 00-1.7 1l-2.4-1-2 3.4L6.6 11a8 8 0 000 2l-2 1.6 2 3.4 2.4-1a8 8 0 001.7 1L11 21h4l.3-2.4a8 8 0 001.7-1l2.4 1 2-3.4z" />
    </Icon>
  ),
};

const NAV_ITEMS: { key: keyof typeof ICONS; label: string; active?: boolean }[] = [
  { key: "dashboard", label: "Dashboard", active: true },
  { key: "reports", label: "Reports" },
  { key: "trends", label: "Trends" },
  { key: "family", label: "Family" },
];

export default function SidebarNav() {
  return (
    <div
      style={{
        width: "72px",
        flexShrink: 0,
        background: "#0f1a3d",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "1.1rem 0",
        gap: "1.5rem",
      }}
    >
      <button
        aria-label="Menu"
        style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", padding: 0 }}
      >
        {ICONS.menu}
      </button>

      <nav style={{ display: "flex", flexDirection: "column", gap: "0.6rem", flex: 1 }}>
        {NAV_ITEMS.map((item) => (
          <button
            key={item.key}
            title={item.label}
            aria-label={item.label}
            aria-current={item.active}
            style={{
              width: "42px",
              height: "42px",
              borderRadius: "10px",
              border: "none",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: item.active ? "#2563eb" : "transparent",
              color: item.active ? "#ffffff" : "#94a3b8",
              cursor: "pointer",
            }}
          >
            {ICONS[item.key]}
          </button>
        ))}
      </nav>

      <button
        aria-label="Settings"
        style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", padding: 0 }}
      >
        {ICONS.settings}
      </button>
    </div>
  );
}
