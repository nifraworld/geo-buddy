/* Minimal static server for local development (no bundler needed). */
import { createServer } from "node:http";
import { readFileSync, createReadStream, existsSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const port = process.env.PORT || 4173;

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".webp": "image/webp",
  ".woff2": "font/woff2",
  ".ico": "image/x-icon",
};

createServer((req, res) => {
  const url = new URL(req.url, "http://x");
  let p = decodeURIComponent(url.pathname);
  if (p === "/") p = "/index.html";
  const abs = path.join(root, p);
  const safe = abs.startsWith(root);
  if (!safe || !existsSync(abs) || statSync(abs).isDirectory()) {
    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("404");
    return;
  }
  const ext = path.extname(abs).toLowerCase();
  res.writeHead(200, { "Content-Type": MIME[ext] || "application/octet-stream", "Cache-Control": "no-cache" });
  createReadStream(abs).pipe(res);
}).listen(port, "127.0.0.1", () => {
  console.log(`Geo Buddy dev server → http://127.0.0.1:${port}`);
});