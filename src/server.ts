import http from "node:http";
import { logger } from "./logger.js";
import { verifyMetaSignature } from "./meta/verify.js";
import type { WebhookMessage } from "./types.js";

const HOST = "127.0.0.1";
const PORT = Number(process.env.PORT ?? 3000);
const MAX_BODY_BYTES = 1024 * 1024; // 1MB
const DEDUPE_TTL_MS = 24 * 60 * 60 * 1000; // 24h

const VERIFY_TOKEN = process.env.VERIFY_TOKEN;
const APP_SECRET = process.env.APP_SECRET;

if (!VERIFY_TOKEN) {
  console.error("VERIFY_TOKEN is required");
  process.exit(1);
}

if (!APP_SECRET) {
  console.error("APP_SECRET is required");
  process.exit(1);
}

if (!Number.isInteger(PORT) || PORT < 1 || PORT > 65535) {
  console.error("PORT must be an integer between 1 and 65535");
  process.exit(1);
}

const seenMids = new Map<string, number>();

function isDuplicate(mid: string): boolean {
  const now = Date.now();
  for (const [k, ts] of seenMids) {
    if (now - ts > DEDUPE_TTL_MS) seenMids.delete(k);
  }
  if (seenMids.has(mid)) return true;
  seenMids.set(mid, now);
  return false;
}

function readRawBody(req: http.IncomingMessage, maxBytes: number): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    let size = 0;
    req.on("data", (chunk: Buffer) => {
      size += chunk.length;
      if (size > maxBytes) {
        reject(new Error("BODY_TOO_LARGE"));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}


function sendJson(res: http.ServerResponse, status: number, body: unknown): void {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(body));
}

import type { WebhookMessage } from "./types.js";

function extractMessages(payload: unknown): WebhookMessage[] {
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

async function handleWebhookPost(req: http.IncomingMessage, res: http.ServerResponse): Promise<void> {
  const rawBody = await readRawBody(req, MAX_BODY_BYTES);
  const sig = req.headers["x-hub-signature-256"];
  const sigHeader = Array.isArray(sig) ? sig[0] : sig;

  if (!verifyMetaSignature(rawBody, sigHeader, APP_SECRET!)) {
    sendJson(res, 403, { error: "Forbidden" });
    return;
  }

  let payload: unknown;
  try {
    payload = JSON.parse(rawBody.toString("utf8"));
  } catch {
    sendJson(res, 400, { error: "Invalid JSON" });
    return;
  }

  const messages = extractMessages(payload);
  for (const msg of messages) {
    if (isDuplicate(msg.mid)) {
      logger.info("duplicate_ignored", { mid: msg.mid });
      continue;
    }
    logger.info("message_received", { mid: msg.mid, senderId: msg.senderId, text: msg.text });
  }

  res.writeHead(200, { "Content-Type": "text/plain; charset=utf-8" });
  res.end("EVENT_RECEIVED");
}

const server = http.createServer(async (req, res) => {
  const started = Date.now();
  try {
    const method = req.method ?? "GET";
    const url = new URL(req.url ?? "/", `http://${req.headers.host ?? "localhost"}`);
    const pathname = url.pathname;

    if (method === "GET" && pathname === "/health") {
      sendJson(res, 200, { status: "ok" });
      return;
    }

    if (method === "GET" && pathname === "/webhook") {
      const mode = url.searchParams.get("hub.mode");
      const token = url.searchParams.get("hub.verify_token");
      const challenge = url.searchParams.get("hub.challenge");

      if (mode === "subscribe" && token === VERIFY_TOKEN && challenge !== null) {
        res.writeHead(200, { "Content-Type": "text/plain; charset=utf-8" });
        res.end(challenge);
        return;
      }

      sendJson(res, 403, { error: "Forbidden" });
      return;
    }

    if (method === "POST" && pathname === "/webhook") {
      await handleWebhookPost(req, res);
      return;
    }

    sendJson(res, 404, { error: "Not Found" });
  } catch (err) {
    if (err instanceof Error && err.message === "BODY_TOO_LARGE") {
      sendJson(res, 413, { error: "Payload Too Large" });
      return;
    }
    logger.error("request_error", { err: err instanceof Error ? err.message : String(err) });
    if (!res.headersSent) {
      sendJson(res, 500, { error: "Internal Server Error" });
    }
  } finally {
    logger.info("http_request", {
      method: req.method,
      url: req.url,
      status: res.statusCode,
      ms: Date.now() - started,
    });
  }
});

server.listen(PORT, HOST, () => {
  logger.info("server_listening", { host: HOST, port: PORT });
});
