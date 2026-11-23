import http from "node:http";
import crypto from "node:crypto";

const HOST = "127.0.0.1";
const PORT = 3000;
const MAX_BODY_BYTES = 1024 * 1024;

const VERIFY_TOKEN = process.env.VERIFY_TOKEN;
const APP_SECRET = process.env.APP_SECRET;

if (!VERIFY_TOKEN) {
  console.warn("warning: VERIFY_TOKEN is not set, webhook verification will fail");
  process.exit(1);
}

if(!APP_SECRET) {
  console.warn("warning: APP_SECRET is not set, verification fail");
  process.exit(1);
}

if(!Number.isInteger(PORT) || PORT < 1 || PORT > 65535) {
  console.warn("warning: PORT must be in range from 1 to 65535");
  process.exit(1);
}

// chung một function sendjson
function sendJson(res: http.ServerResponse, status: number, body: unknown): void {
  res.writeHead(status, {"Content-Type" : "application/json; charset=utf-8"});
  res.end(JSON.stringify(body));
  }

function readRawBody(req: http.IncomingMessage, maxBytes: number) {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    let size = 0;

    req.on("data", (chunk: Buffer) => {
      size += chunk.length;
      if(size > maxBytes) {
        reject(new Error("BODY TOO LARGE"));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  })
}

  

const server = http.createServer((req, res) => {
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

  sendJson(res, 404, { error: "Not Found" });
});


server.listen(PORT, HOST, () => {
  console.log(`listening on http://${HOST}:${PORT}`);
});