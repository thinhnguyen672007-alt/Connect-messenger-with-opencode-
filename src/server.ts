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

if(!Number.isInterger(PORT) || PORT < 1 || PORT > 65535) {
  console.warn("warning: PORT must be in range from 1 to 65535");
  process.exit(1);
}


const server = http.createServer((req, res) => {
  const method = req.method ?? "GET";
  const url = new URL(req.url ?? "/", `http://${req.headers.host ?? "localhost"}`);
  const pathname = url.pathname;

  if (method === "GET" && pathname === "/health") {
    res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
    res.end(JSON.stringify({ status: "ok" }));
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

    res.writeHead(403, { "Content-Type": "application/json; charset=utf-8" });
    res.end(JSON.stringify({ error: "Forbidden" }));
    return;
  }

  res.writeHead(404, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify({ error: "Not Found" }));
});


server.listen(PORT, HOST, () => {
  console.log(`listening on http://${HOST}:${PORT}`);
});