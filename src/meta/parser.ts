import type { WebhookMessage } from "../types.js";

export function extractMessages(payload: unknown): WebhookMessage[] {
  if (!payload || typeof payload !== "object") return [];
  const p = payload as { object?: unknown; entry?: unknown };
  if (p.object !== "page" || !Array.isArray(p.entry)) return [];

  const out: WebhookMessage[] = [];
  for (const entry of p.entry) {
    if (!entry || typeof entry !== "object") continue;
    const e = entry as { id?: unknown; messaging?: unknown };
    const pageId = typeof e.id === "string" ? e.id : "";
    if (!Array.isArray(e.messaging)) continue;

    for (const event of e.messaging) {
      if (!event || typeof event !== "object") continue;
      const ev = event as {
        sender?: { id?: unknown };
        message?: { mid?: unknown; text?: unknown; is_echo?: unknown };
        timestamp?: unknown;
      };
      if (ev.message?.is_echo) continue;
      const senderId = typeof ev.sender?.id === "string" ? ev.sender.id : "";
      const mid = typeof ev.message?.mid === "string" ? ev.message.mid : "";
      const text = typeof ev.message?.text === "string" ? ev.message.text : "";
      const timestamp = typeof ev.timestamp === "number" ? ev.timestamp : 0;
      if (!senderId || !mid || !text) continue;
      out.push({ senderId, pageId, mid, text, timestamp });
    }
  }
  return out;
}
