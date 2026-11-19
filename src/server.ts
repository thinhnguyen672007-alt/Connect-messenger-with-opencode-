import http from "node:http";

const HOST = "127.0.0.1";
const PORT = 3000;

const VERIFY_TOKEN = process.env.VERIFY_TOKEN;

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

if (!VERIFY_TOKEN) {
  console.warn("warning: VERIFY_TOKEN is not set, webhook verification will fail");
}

server.listen(PORT, HOST, () => {
  console.log(`listening on http://${HOST}:${PORT}`);
});