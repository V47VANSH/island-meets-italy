/**
 * Asset-prep harness: renders PDF pages and extracts PDF text, using pdf.js
 * inside headless Chrome.
 *
 * This machine has no poppler, Ghostscript, Inkscape or ImageMagick, and the
 * brand package arrived as PDF and EPS. Rather than add a runtime dependency,
 * pdf.js is loaded from a CDN into a throwaway browser and the source files are
 * served over localhost. Nothing here enters the site build.
 *
 * Usage:
 *   node scripts/pdfkit.mjs info   "<pdf>"
 *   node scripts/pdfkit.mjs text   "<pdf>" [page]
 *   node scripts/pdfkit.mjs render "<pdf>" <page> <scale> <out.png>
 */
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const PDFJS = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38';
const ROOT = resolve('.');

const [, , cmd, file, a1, a2, a3] = process.argv;
if (!cmd || !file) {
  console.error('usage: pdfkit.mjs <info|text|render> "<pdf>" [...]');
  process.exit(1);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ── serve the project so the browser can fetch the PDF by URL ───────────
const server = createServer(async (req, res) => {
  try {
    const p = join(ROOT, decodeURIComponent((req.url ?? '/').split('?')[0]));
    const body = await readFile(p);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/octet-stream');
    res.end(body);
  } catch {
    res.writeHead(404);
    res.end('nope');
  }
});
const PORT = 4900 + Math.floor(Math.random() * 90);
await new Promise((r) => server.listen(PORT, r));

// ── drive Chrome ────────────────────────────────────────────────────────
const port = 9100 + Math.floor(Math.random() * 150);
const chrome = spawn(CHROME, [
  '--headless=new',
  '--disable-gpu',
  `--remote-debugging-port=${port}`,
  '--window-size=1400,1000',
  '--user-data-dir=' + process.env.TEMP + '/imi-pdf-' + port,
  'about:blank',
]);

let page;
for (let i = 0; i < 80 && !page; i++) {
  try {
    page = (await (await fetch(`http://127.0.0.1:${port}/json/list`)).json()).find(
      (t) => t.type === 'page',
    );
  } catch {}
  if (!page) await sleep(250);
}
const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((r) => (ws.onopen = r));
let id = 0;
const pending = new Map();
ws.onmessage = (e) => {
  const m = JSON.parse(e.data);
  if (m.id && pending.has(m.id)) {
    pending.get(m.id)(m.result);
    pending.delete(m.id);
  }
};
const send = (method, params = {}) =>
  new Promise((res) => {
    const n = ++id;
    pending.set(n, res);
    ws.send(JSON.stringify({ id: n, method, params }));
  });

const evaluate = async (expression) => {
  const r = await send('Runtime.evaluate', {
    expression,
    returnByValue: true,
    awaitPromise: true,
    timeout: 180000,
  });
  if (r.exceptionDetails) {
    throw new Error(
      r.exceptionDetails.exception?.description ?? r.exceptionDetails.text,
    );
  }
  return r.result?.value;
};

await send('Page.enable');
await send('Runtime.enable');

const host = `http://127.0.0.1:${PORT}`;
const url = `${host}/${file.split('\\').join('/').split('/').map(encodeURIComponent).join('/')}`;

// A blank same-origin page, then load pdf.js into it.
await send('Page.navigate', { url: host + '/package.json' });
await sleep(400);
await evaluate(`
  new Promise((ok, bad) => {
    const s = document.createElement('script');
    s.src = '${PDFJS}/pdf.min.mjs';
    s.type = 'module';
    s.onerror = () => bad(new Error('pdf.js failed to load'));
    document.head.appendChild(s);
    const t = setInterval(() => {
      if (window.pdfjsLib) { clearInterval(t); window.__pdfjsEsm = true; ok(1); }
    }, 100);
    setTimeout(() => { clearInterval(t); bad(new Error('pdf.js timeout')); }, 30000);
  })
`).catch(async () => {
  // The ESM build does not set a global; fall back to the classic build.
  await evaluate(`
    new Promise((ok, bad) => {
      const s = document.createElement('script');
      s.src = '${PDFJS}/pdf.min.js';
      s.onload = () => ok(1);
      s.onerror = () => bad(new Error('pdf.js classic failed'));
      document.head.appendChild(s);
    })
  `);
});

// The ESM build needs the .mjs worker; the classic build needs the .js one.
await evaluate(
  `pdfjsLib.GlobalWorkerOptions.workerSrc =
     '${PDFJS}/pdf.worker.min.' + (window.__pdfjsEsm ? 'mjs' : 'js'); 1`,
);
// Wrapped in an async IIFE: Runtime.evaluate has no top-level await.
await evaluate(
  `(async () => {
     window.__doc = await pdfjsLib.getDocument({
       url: ${JSON.stringify(url)},
       disableFontFace: true,
     }).promise;
     return window.__doc.numPages;
   })()`,
);

if (cmd === 'info') {
  console.log(
    await evaluate(`(async () => {
      const d = window.__doc;
      const out = { pages: d.numPages, sizes: [] };
      for (let i = 1; i <= Math.min(d.numPages, 40); i++) {
        const p = await d.getPage(i);
        const v = p.getViewport({ scale: 1 });
        out.sizes.push(i + ': ' + Math.round(v.width) + 'x' + Math.round(v.height));
      }
      return JSON.stringify(out, null, 1);
    })()`),
  );
}

if (cmd === 'text') {
  const from = a1 ? Number(a1) : 1;
  const to = a2 ? Number(a2) : from;
  console.log(
    await evaluate(`(async () => {
      const d = window.__doc;
      let out = '';
      for (let i = ${from}; i <= Math.min(${to}, d.numPages); i++) {
        const p = await d.getPage(i);
        const c = await p.getTextContent();
        out += '\\n───── page ' + i + ' ─────\\n';
        let line = '', lastY = null;
        for (const it of c.items) {
          const y = Math.round(it.transform[5]);
          if (lastY !== null && Math.abs(y - lastY) > 3) { out += line.trim() + '\\n'; line = ''; }
          line += it.str + (it.hasEOL ? '\\n' : '');
          lastY = y;
        }
        out += line.trim() + '\\n';
      }
      return out;
    })()`),
  );
}

if (cmd === 'runs') {
  // Exact placement of every text run: font, size and transform. Used to
  // reproduce David's lockup proportionally rather than by eye.
  console.log(
    await evaluate(`(async () => {
      const p = await window.__doc.getPage(${Number(a1 ?? 1)});
      const c = await p.getTextContent();
      const styles = c.styles;
      return JSON.stringify(c.items.filter(i => i.str.trim()).map(i => ({
        str: i.str,
        font: styles[i.fontName] ? styles[i.fontName].fontFamily : i.fontName,
        w: Math.round(i.width * 100) / 100,
        h: Math.round(i.height * 100) / 100,
        x: Math.round(i.transform[4] * 100) / 100,
        y: Math.round(i.transform[5] * 100) / 100,
        scale: Math.round(i.transform[0] * 100) / 100,
      })), null, 1);
    })()`),
  );
}

if (cmd === 'render') {
  const pageNo = Number(a1 ?? 1);
  const scale = Number(a2 ?? 2);
  const out = a3 ?? 'out.png';
  const b64 = await evaluate(`(async () => {
    const p = await window.__doc.getPage(${pageNo});
    const v = p.getViewport({ scale: ${scale} });
    const c = document.createElement('canvas');
    c.width = Math.round(v.width); c.height = Math.round(v.height);
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, c.width, c.height);
    await p.render({ canvasContext: ctx, viewport: v }).promise;
    return c.toDataURL('image/png').split(',')[1];
  })()`);
  writeFileSync(out, Buffer.from(b64, 'base64'));
  console.log(`${out} written (page ${pageNo} @ ${scale}x)`);
}

ws.close();
chrome.kill();
server.close();
process.exit(0);
