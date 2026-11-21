import http from "node:http";
import crypto from "node:crypto";

const HOST = "127.0.0.1";
const PORT = Number(process.env.PORT ?? 3000);
const MAX_BODY_BYTES = 1024 * 1024; // 1MB

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

function verifySignature(rawBody: Buffer, header: string | undefined): boolean {
  if (!header?.startsWith("sha256=")) return false;
  const received = Buffer.from(header.slice("sha256=".length), "hex");
  const expected = crypto.createHmac("sha256", APP_SECRET!).update(rawBody).digest();
  if (received.length !== expected.length) return false;
  return crypto.timingSafeEqual(received, expected);
}

function sendJson(res: http.ServerResponse, status: number, body: unknown): void {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(body));
}

const server = http.createServer(async (req, res) => {
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
      const rawBody = await readRawBody(req, MAX_BODY_BYTES);
      const sig = req.headers["x-hub-signature-256"];
      const sigHeader = Array.isArray(sig) ? sig[0] : sig;

      if (!verifySignature(rawBody, sigHeader)) {
        sendJson(res, 403, { error: "Forbidden" });
        return;
      }

      const payload = JSON.parse(rawBody.toString("utf8"));
      console.log("webhook event:", JSON.stringify(payload));

      res.writeHead(200, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("EVENT_RECEIVED");
      return;
    }

    sendJson(res, 404, { error: "Not Found" });
  } catch (err) {
    if (err instanceof Error && err.message === "BODY_TOO_LARGE") {
      sendJson(res, 413, { error: "Payload Too Large" });
      return;
    }
    console.error("request error:", err);
    if (!res.headersSent) {
      sendJson(res, 500, { error: "Internal Server Error" });
    }
  }
});

server.listen(PORT, HOST, () => {
  console.log(`listening on http://${HOST}:${PORT}`);
});
