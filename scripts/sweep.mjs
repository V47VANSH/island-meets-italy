/**
 * Responsive overflow sweep. Drives an offscreen iframe across a width ladder
 * and asserts nothing sticks out of the viewport on any page at any width.
 *
 * Catches the regressions that hide between breakpoints, which spot-checking
 * at 390/1440 never does.
 *
 * Usage: node scripts/sweep.mjs [baseUrl]
 */
import { spawn } from 'node:child_process';

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const base = process.argv[2] ?? 'http://127.0.0.1:4600';
const PAGES = ['/', '/about', '/cookbook', '/gallery', '/media', '/contact', '/404.html'];

const WIDTHS = [];
for (let w = 320; w <= 900; w += 20) WIDTHS.push(w);
for (let w = 920; w <= 1700; w += 40) WIDTHS.push(w);
for (let w = 1760; w <= 2600; w += 80) WIDTHS.push(w);

const port = 9800 + Math.floor(Math.random() * 100);
const chrome = spawn(CHROME, ['--headless=new', '--disable-gpu', '--hide-scrollbars',
  `--remote-debugging-port=${port}`, '--window-size=1200,900',
  '--user-data-dir=' + process.env.TEMP + '/imi-sweep-' + port, 'about:blank']);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let pg;
for (let i = 0; i < 60 && !pg; i++) {
  try { pg = (await (await fetch(`http://127.0.0.1:${port}/json/list`)).json()).find((t) => t.type === 'page'); } catch {}
  if (!pg) await sleep(250);
}
const ws = new WebSocket(pg.webSocketDebuggerUrl);
await new Promise((r) => (ws.onopen = r));
let id = 0; const pending = new Map();
ws.onmessage = (e) => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m.result); pending.delete(m.id); } };
const send = (method, params = {}) => new Promise((r) => { const n = ++id; pending.set(n, r); ws.send(JSON.stringify({ id: n, method, params })); });
const evAsync = async (expr) => {
  const r = await send('Runtime.evaluate', { expression: `(async()=>{${expr}})().then(v=>JSON.stringify(v))`, returnByValue: true, awaitPromise: true });
  if (r.exceptionDetails) throw new Error(r.result?.description ?? 'eval failed');
  return JSON.parse(r.result.value);
};

await send('Page.enable'); await send('Runtime.enable');
await send('Page.navigate', { url: base + '/' }); await sleep(2200);

const result = await evAsync(`
  const PAGES = ${JSON.stringify(PAGES)};
  const WIDTHS = ${JSON.stringify(WIDTHS)};
  const bad = [];
  const frame = document.createElement('iframe');
  frame.style.cssText = 'position:fixed;left:-30000px;top:0;border:0;height:900px;';
  document.body.appendChild(frame);
  for (const w of WIDTHS) {
    frame.style.width = w + 'px';
    for (const p of PAGES) {
      await new Promise((res) => { frame.onload = res; frame.src = p; });
      const d = frame.contentDocument;
      d.documentElement.classList.remove('js-reveal');
      d.querySelectorAll('[data-reveal]').forEach((e) => e.classList.add('is-revealed'));
      await new Promise((r) => setTimeout(r, 40));
      const W = d.documentElement.clientWidth;
      const who = [];
      for (const el of d.querySelectorAll('body *')) {
        const b = el.getBoundingClientRect();
        if ((!b.width && !b.height) || b.left < -1000) continue;   // honeypot lives at -9999
        if (b.right > W + 1 || b.left < -1) who.push((el.getAttribute('class') || el.tagName).toString().split(' ')[0].slice(0, 26));
      }
      if (who.length) bad.push(w + ' ' + p + ': ' + [...new Set(who)].slice(0, 3).join(', '));
    }
  }
  frame.remove();
  return { widths: WIDTHS.length, combos: WIDTHS.length * PAGES.length, failures: bad };
`);

console.log(`${result.combos} combinations (${result.widths} widths x ${PAGES.length} pages), ${WIDTHS[0]}-${WIDTHS[WIDTHS.length-1]}px`);
if (result.failures.length === 0) console.log('SWEEP PASSED — no horizontal overflow');
else { console.log(`SWEEP FAILED — ${result.failures.length} combination(s):`); for (const f of result.failures) console.log('  ' + f); }
chrome.kill();
process.exit(result.failures.length === 0 ? 0 : 1);
