import type { WebhookMessage } from "./types.js";
import { logger } from "./logger.js";
import { generateReply } from "./opencode.js";
import { sendMessengerText } from "./messenger/send.js";

export async function processMessage(msg: WebhookMessage): Promise<void> {
  logger.info("job_processing", { mid: msg.mid, senderId: msg.senderId });
  const reply = await generateReply(msg.text);
  logger.info("reply_ready", { mid: msg.mid, senderId: msg.senderId });
  await sendMessengerText(msg.senderId, reply);
}
