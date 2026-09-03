/**
 * Builds the wordmark as outlined SVG paths.
 *
 * LICENSING — the whole reason this exists.
 *
 * The wordmark is set in Balkist Bold ("Island", "Italy") and Bandung Signature
 * ("meets"). Both are commercial fonts from independent designers; Balkist is
 * fsType 4 (Preview & Print only) and neither carries an embedding licence. The
 * client's desktop licence covers *making artwork* with them, which is what
 * this does — it converts specific letterforms into static outlines, once, at
 * build-prep time. It does NOT produce a webfont, and no font binary is copied
 * into the project. `Logo - Text.pdf` could not be used directly because it
 * carries those fonts embedded as live text.
 *
 * opentype.js runs from a CDN inside a throwaway headless browser; the fonts
 * are read from the scratch directory, never from the repo.
 *
 * Usage: node scripts/wordmark.mjs <fontsDir> <out.svg>
 */
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const [, , fontsDir, outFile = 'wordmark.svg'] = process.argv;
const OT = 'https://cdnjs.cloudflare.com/ajax/libs/opentype.js/1.3.4/opentype.min.js';
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const ROOT = resolve(fontsDir);
const server = createServer(async (req, res) => {
  try {
    const body = await readFile(join(ROOT, decodeURIComponent((req.url ?? '').split('?')[0])));
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.end(body);
  } catch {
    res.writeHead(404);
    res.end();
  }
});
const PORT = 4960 + Math.floor(Math.random() * 30);
await new Promise((r) => server.listen(PORT, r));

const port = 9420 + Math.floor(Math.random() * 60);
const chrome = spawn(CHROME, [
  '--headless=new',
  '--disable-gpu',
  `--remote-debugging-port=${port}`,
  '--user-data-dir=' + process.env.TEMP + '/imi-wm-' + port,
  'about:blank',
]);
let pg;
for (let i = 0; i < 80 && !pg; i++) {
  try {
    pg = (await (await fetch(`http://127.0.0.1:${port}/json/list`)).json()).find((t) => t.type === 'page');
  } catch {}
  if (!pg) await sleep(250);
}
const ws = new WebSocket(pg.webSocketDebuggerUrl);
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
  new Promise((r) => {
    const n = ++id;
    pending.set(n, r);
    ws.send(JSON.stringify({ id: n, method, params }));
  });
const ev = async (expression) => {
  const r = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true, timeout: 120000 });
  if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description ?? r.exceptionDetails.text);
  return r.result?.value;
};

await send('Page.enable');
await send('Runtime.enable');
await send('Page.navigate', { url: `http://127.0.0.1:${PORT}/JosefinSans-Regular.ttf` });
await sleep(300);
await send('Page.navigate', { url: `http://127.0.0.1:${PORT}/` });
await sleep(300);

await ev(`new Promise((ok,bad)=>{const s=document.createElement('script');s.src=${JSON.stringify(OT)};
  s.onload=()=>ok(1);s.onerror=()=>bad(new Error('opentype.js failed'));document.head.appendChild(s);})`);

/**
 * Lockup geometry, read out of `Logo - Text.pdf` rather than eyeballed.
 *
 * pdf.js reported David's actual text placement on that page:
 *   Island  Balkist  size 36.31  x 210.84  y 465.65
 *   Italy   Balkist  size 36.31  x 457.67  y 465.65
 *   meets   Bandung  size 118.94 x 359.48  y 448.87
 *
 * Expressed below as multiples of the serif size, so the whole mark scales as
 * one. The script really is set 3.276x the serif — a signature face with small
 * glyphs in a large em, which is why a naive 0.6x looked like a typo.
 */
const S = 200;
const LOCKUP = {
  size: S,
  words: [
    { text: 'Island', font: 'Balkist-Bold.otf', x: 0, y: 0, size: S },
    {
      text: 'meets',
      font: 'Bandung-Signature.otf',
      x: 4.093 * S,
      // PDF y counts upward, SVG down: the script baseline sits below the
      // serif one, so it moves *down* the page here.
      y: 0.462 * S,
      size: 3.276 * S,
    },
    { text: 'Italy', font: 'Balkist-Bold.otf', x: 6.798 * S, y: 0, size: S },
  ],
};

const result = await ev(`(async () => {
  const L = ${JSON.stringify(LOCKUP)};
  const load = (f) => new Promise((ok, bad) =>
    opentype.load('http://127.0.0.1:${PORT}/' + f, (e, font) => e ? bad(e) : ok(font)));

  const out = [];
  let minY = Infinity, maxY = -Infinity, maxX = -Infinity, minX = Infinity;

  for (const w of L.words) {
    const font = await load(w.font);
    // Absolute placement from the source lockup — no cursor accumulation, so
    // the overlap between the script and the two serif words is David's.
    const p = font.getPath(w.text, w.x, w.y, w.size, { kerning: true });
    const bb = p.getBoundingBox();
    const d = p.toPathData(3);
    if (d && d.length > 2) {
      out.push({ word: w.text, d, bb });
      minX = Math.min(minX, bb.x1); maxX = Math.max(maxX, bb.x2);
      minY = Math.min(minY, bb.y1); maxY = Math.max(maxY, bb.y2);
    }
  }
  return JSON.stringify({ out, minX, minY, maxX, maxY });
})()`);

const { out, minX, minY, maxX, maxY } = JSON.parse(result);
const pad = LOCKUP.size * 0.04;
const vbX = minX - pad;
const vbY = minY - pad;
const vbW = maxX - minX + pad * 2;
const vbH = maxY - minY + pad * 2;

const body = out
  .map((o) => `<path d="${o.d}" fill="currentColor"/>`)
  .join('');

writeFileSync(
  outFile,
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vbX.toFixed(2)} ${vbY.toFixed(2)} ${vbW.toFixed(2)} ${vbH.toFixed(2)}">${body}</svg>`,
);
console.log(
  `${outFile}  ${out.length} words outlined  viewBox ${vbW.toFixed(0)}x${vbH.toFixed(0)}`,
);
for (const o of out) console.log(`   ${o.word.padEnd(8)} ${Math.round(o.bb.x2 - o.bb.x1)}x${Math.round(o.bb.y2 - o.bb.y1)}`);

ws.close();
chrome.kill();
server.close();
process.exit(0);
