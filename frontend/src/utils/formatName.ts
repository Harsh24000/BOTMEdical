/**
 * Display-only formatting. Many Indian lab reports print the patient name
 * in ALL CAPS in the header/footer, and the backend deliberately extracts
 * it EXACTLY as printed (no fabrication). This just title-cases it for
 * display — "SHUVAYAN SARKAR" -> "Shuvayan Sarkar" — it doesn't change
 * what name was extracted, only how it's rendered.
 */
export function toDisplayName(raw: string): string {
  if (!raw) return raw;
  return raw
    .toLowerCase()
    .split(/\s+/)
    .map((word) =>
      word
        .split("-")
        .map((part) => (part ? part[0].toUpperCase() + part.slice(1) : part))
        .join("-")
    )
    .join(" ");
}
