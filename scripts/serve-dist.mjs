// Serve `dist/` with the same headers and SPA rewrite as vercel.json, to check the
// production Content Security Policy locally:  npm run build && npm run preview:vercel
import { readFile, stat } from 'node:fs/promises';
import { createServer } from 'node:http';
import { extname, join, normalize } from 'node:path';
import { gzipSync } from 'node:zlib';

const root = join(process.cwd(), process.argv[2] ?? 'dist');
const port = Number(process.argv[3] ?? 4175);
const vercel = JSON.parse(await readFile('vercel.json', 'utf8'));

const types = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.json': 'application/json',
  '.webmanifest': 'application/manifest+json',
  '.txt': 'text/plain',
};

/** Vercel-style source ("/assets/(.*)") to a RegExp. */
const toRegExp = (source) =>
  new RegExp(`^${source.replace(/\./g, '\\.').replace(/\(\.\*\)/g, '(.*)')}$`);

createServer(async (req, res) => {
  const path = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  for (const rule of vercel.headers ?? []) {
    if (toRegExp(rule.source).test(path)) {
      for (const h of rule.headers) res.setHeader(h.key, h.value);
    }
  }
  let file = normalize(join(root, path));
  if (!file.startsWith(root)) return res.writeHead(403).end();
  try {
    if (!(await stat(file)).isFile()) throw new Error('not a file');
  } catch {
    file = join(root, 'index.html'); // SPA rewrite
  }
  res.setHeader('Content-Type', types[extname(file)] ?? 'application/octet-stream');
  const body = await readFile(file);
  // Vercel compresses text responses; do the same so local measurements are realistic.
  if (
    /gzip/.test(req.headers['accept-encoding'] ?? '') &&
    /\.(html|js|css|svg|json|webmanifest|txt)$/.test(file)
  ) {
    res.setHeader('Content-Encoding', 'gzip');
    res.setHeader('Vary', 'Accept-Encoding');
    return res.end(gzipSync(body));
  }
  res.end(body);
}).listen(port, () => console.log(`dist with vercel.json headers on http://localhost:${port}`));
