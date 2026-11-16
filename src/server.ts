import http from "node:http";

const server = http.createServer((req, res) => {
  if (req.method === "GET" && req.url === "/health") {
    res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
    res.end(JSON.stringify({
      status: "ok"
    }));
  } else {
    res.writeHead(404, { "Content-Type": "application/json; charset=utf-8" });
    res.end(JSON.stringify({
      error: "Not Found"
    }));
  }
});

const HOST = "127.0.0.1";
const PORT = 3000;

server.listen(PORT, HOST, () => {
  console.log(`listening on http://${HOST}:${PORT}`);
});
