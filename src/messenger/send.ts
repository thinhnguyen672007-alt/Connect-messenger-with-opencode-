import { logger } from "../logger.js";

const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;

export async function sendMessengerText(recipientId: string, text: string): Promise<void> {
  if (!PAGE_ACCESS_TOKEN) {
    logger.warn("messenger_send_skipped_missing_token", { recipientId, textLen: text.length });
    return;
  }

  const url = `https://graph.facebook.com/v21.0/me/messages?access_token=${encodeURIComponent(PAGE_ACCESS_TOKEN)}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      messaging_type: "RESPONSE",
      recipient: { id: recipientId },
      message: { text },
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Messenger send failed: ${res.status} ${body}`);
  }

  logger.info("messenger_sent", { recipientId });
}
