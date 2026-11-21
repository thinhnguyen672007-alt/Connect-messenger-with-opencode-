import http from "node:http";

const HOST = "127.0.0.1";
const PORT = Number(process.env.PORT ?? 3000);

const VERIFY_TOKEN = process.env.VERIFY_TOKEN;
if (!VERIFY_TOKEN) {
  console.error("VERIFY_TOKEN is required");
  process.exit(1);
}

if (!Number.isInteger(PORT) || PORT < 1 || PORT > 65535) {
  console.error("PORT must be an integer between 1 and 65535");
  process.exit(1);
}

function sendJson(res: http.ServerResponse, status: number, body: unknown): void {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(body));
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
