import type { WebhookMessage } from "./types.js";
import { logger } from "./logger.js";

export async function processMessage(msg: WebhookMessage): Promise<void> {
  // Architecture C: this becomes BullMQ worker calling OpenCode + Messenger Send API.
  logger.info("job_processing", { mid: msg.mid, senderId: msg.senderId, text: msg.text });
  // TODO: generate reply via OpenCode, persist to DB, send via Messenger API.
}
