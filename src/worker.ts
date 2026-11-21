import type { WebhookMessage } from "./types.js";
import { logger } from "./logger.js";
import { generateReply } from "./opencode.js";

export async function processMessage(msg: WebhookMessage): Promise<void> {
  logger.info("job_processing", { mid: msg.mid, senderId: msg.senderId });
  const reply = await generateReply(msg.text);
  // Next: persist conversation + send reply via Messenger Send API.
  logger.info("reply_ready", { mid: msg.mid, senderId: msg.senderId, reply });
}
