import { logger } from "./logger.js";

// Placeholder for OpenCode HTTP/SDK integration.
// Production direction: `opencode serve` + authenticated API calls from worker.
export async function generateReply(text: string): Promise<string> {
  logger.warn("opencode_not_configured", { textLen: text.length });
  return `Echo: ${text}`;
}
