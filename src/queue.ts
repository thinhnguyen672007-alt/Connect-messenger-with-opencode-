import type { WebhookMessage } from "./types.js";
import { logger } from "./logger.js";

type JobHandler = (msg: WebhookMessage) => Promise<void>;

// Minimal in-memory queue. Replace with BullMQ/Redis for Architecture C durability.
export class InMemoryQueue {
  private q: WebhookMessage[] = [];
  private running = false;

  constructor(private handler: JobHandler) {}

  async enqueue(msg: WebhookMessage): Promise<void> {
    this.q.push(msg);
    logger.info("job_enqueued", { mid: msg.mid, queueSize: this.q.length });
    void this.drain();
  }

  private async drain(): Promise<void> {
    if (this.running) return;
    this.running = true;
    try {
      while (this.q.length > 0) {
        const msg = this.q.shift()!;
        try {
          await this.handler(msg);
        } catch (err) {
          logger.error("job_failed", {
            mid: msg.mid,
            err: err instanceof Error ? err.message : String(err),
          });
          // No retry in this minimal queue; add retry/DLQ with BullMQ later.
        }
      }
    } finally {
      this.running = false;
    }
  }
}
