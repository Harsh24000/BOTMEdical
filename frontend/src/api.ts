import type { UploadResponse } from "./types";

const BASE = "/api";

export async function uploadReport(file: File, location?: string): Promise<UploadResponse> {
  const form = new FormData();
  form.append("file", file);
  if (location) {
    form.append("location", location);
  }

  const res = await fetch(`${BASE}/upload`, { method: "POST", body: form });
  if (!res.ok) {
    const detail = await res.json().catch(() => ({}));
    throw new Error(detail.detail || `Upload failed (${res.status})`);
  }
  return res.json();
}

/** Thrown when the backend returns 402 — free question limit reached. */
export class PaywallError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PaywallError";
  }
}

/**
 * Send a chat message and stream the assistant reply.
 * `onChunk` is called with each incremental text chunk as it arrives.
 * Throws `PaywallError` specifically when the free-question limit is hit,
 * so the UI can distinguish "upgrade needed" from a generic failure.
 */
export async function streamChat(
  sessionId: string,
  message: string,
  onChunk: (text: string) => void,
): Promise<void> {
  const res = await fetch(`${BASE}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ session_id: sessionId, message }),
  });

  if (res.status === 402) {
    const detail = await res.json().catch(() => ({}));
    throw new PaywallError(detail.detail || "Free question limit reached.");
  }

  if (!res.ok || !res.body) {
    const detail = await res.json().catch(() => ({}));
    throw new Error(detail.detail || `Chat failed (${res.status})`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    onChunk(decoder.decode(value, { stream: true }));
  }
}
