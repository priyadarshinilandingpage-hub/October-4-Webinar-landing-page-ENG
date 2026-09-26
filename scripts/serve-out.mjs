// `npm run preview`: serves the static build (out/) like Cloudflare Pages does: /thank-you → thank-you.html, 404.html for misses.
// No Functions here: /api/* answers 404 (the payment endpoints are covered by the unit tests).
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, join, normalize } from "node:path";

const ROOT = join(process.cwd(), "out");
const TYPES = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".svg": "image/svg+xml", ".webp": "image/webp", ".jpg": "image/jpeg", ".png": "image/png", ".mp4": "video/mp4", ".woff2": "font/woff2", ".txt": "text/plain", ".ico": "image/x-icon" };

async function file(p) {
  try {
    const s = await stat(p);
    return s.isFile() ? p : null;
  } catch {
    return null;
  }
}

createServer(async (req, res) => {
  const path = normalize(decodeURIComponent(new URL(req.url, "http://x").pathname)).replace(/\\/g, "/");
  const base = join(ROOT, path);
  const hit = (await file(base)) ?? (await file(`${base}.html`)) ?? (await file(join(base, "index.html")));
  if (!hit || !hit.startsWith(normalize(ROOT))) {
    res.writeHead(404, { "content-type": "text/html; charset=utf-8" });
    res.end(await readFile(join(ROOT, "404.html")).catch(() => "Not found"));
    return;
  }
  res.writeHead(200, { "content-type": TYPES[extname(hit)] ?? "application/octet-stream" });
  res.end(await readFile(hit));
}).listen(Number(process.env.PORT) || 3300, "127.0.0.1", () => console.log(`serving out/ on http://localhost:${Number(process.env.PORT) || 3300}/`));
