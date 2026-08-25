/**
 * Minimal static server for dist/, used to test cache policy against the real
 * build. `astro preview` always sends `no-cache`, which makes prefetched HTML
 * unusable and hides whether a production Cache-Control actually helps.
 *
 * Usage: node scripts/serve-dist.mjs <port> <html-cache-control>
 */
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { join, extname } from 'node:path';

const [, , port = '4600', htmlCache = 'no-cache'] = process.argv;
const ROOT = 'dist';

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.jpg': 'image/jpeg',
  '.png': 'image/png',
  '.xml': 'application/xml',
  '.txt': 'text/plain; charset=utf-8',
};

createServer(async (req, res) => {
  let path = decodeURIComponent((req.url ?? '/').split('?')[0]);
  let file = join(ROOT, path);

  try {
    const s = await stat(file).catch(() => null);
    if (!s || s.isDirectory()) file = join(ROOT, path, 'index.html');
    const body = await readFile(file);
    const ext = extname(file);

    res.setHeader('Content-Type', TYPES[ext] ?? 'application/octet-stream');
    // Mirrors public/_headers: fingerprinted assets immutable, HTML per arg.
    if (ext === '.html') res.setHeader('Cache-Control', htmlCache);
    else if (path.startsWith('/_astro/') || path.startsWith('/fonts/')) {
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    }
    res.writeHead(200);
    res.end(body);
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('not found');
  }
}).listen(Number(port), () => {
  console.log(`dist/ on :${port}  HTML Cache-Control: ${htmlCache}`);
});
