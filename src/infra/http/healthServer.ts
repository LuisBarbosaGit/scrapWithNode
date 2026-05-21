import { createServer, type Server } from "node:http";

export function startHealthServer(port: number): Server {
  const server = createServer((req, res) => {
    if (req.url === "/health") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ status: "ok" }));
      return;
    }

    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "not_found" }));
  });

  server.listen(port, "0.0.0.0", () => {
    console.log(`Health server em http://0.0.0.0:${port}/health`);
  });

  return server;
}
