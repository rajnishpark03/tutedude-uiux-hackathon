// Local dev server: serves /public and routes /api/* to the same handlers Vercel uses.
// Usage: set -a; source .env; set +a; npm run dev
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(fileURLToPath(new URL(".", import.meta.url)), "..");
const pub = join(root, "public");
const port = Number(process.env.PORT || 3456);
const types = { ".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "text/javascript", ".png": "image/png", ".svg": "image/svg+xml", ".ico": "image/x-icon" };

const server = createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  if (url.pathname.startsWith("/api/")) {
    const name = url.pathname.slice(5).replace(/[^a-z_-]/gi, "");
    try {
      const mod = await import(`../api/${name}.js`);
      return mod.default(req, res);
    } catch (err) {
      res.statusCode = 404;
      return res.end("No such API route");
    }
  }
  let file = normalize(url.pathname === "/" ? "/index.html" : url.pathname);
  try {
    const body = await readFile(join(pub, file));
    res.setHeader("Content-Type", types[extname(file)] || "application/octet-stream");
    res.end(body);
  } catch {
    res.statusCode = 404;
    res.end("Not found");
  }
});

server.listen(port, () => console.log(`Registration site running at http://localhost:${port}`));
