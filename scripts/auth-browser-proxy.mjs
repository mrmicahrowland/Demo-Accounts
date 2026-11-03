import http from "node:http";
const port = Number(process.env.BROWSER_PROXY_PORT ?? 4174);
const server = http.createServer((req, res) => {
  const target = (req.url ?? "").startsWith("/api/") ? 4010 : 4173;
  const upstream = http.request({
    hostname: "127.0.0.1", port: target, method: req.method, path: req.url,
    headers: { ...req.headers, host: `127.0.0.1:${port}` },
  }, response => {
    res.writeHead(response.statusCode ?? 502, response.headers);
    response.pipe(res);
  });
  upstream.on("error", error => { res.writeHead(502); res.end(error.message); });
  req.pipe(upstream);
});
server.listen(port, "127.0.0.1");
