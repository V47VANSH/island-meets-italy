/**
 * Contrast audit (§6.2, §11).
 *
 * Walks every text-bearing element in the live page, resolves its effective
 * background by climbing ancestors, and checks the WCAG AA ratio: 4.5:1 for
 * body text, 3:1 for large text. Also flags the specific trap the build
 * context calls out — --gold (#C8A551) used as text on a light background.
 *
 * Usage: node scripts/contrast.mjs [url] [width] [height]
 */
import { spawn } from 'node:child_process';

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const [, , url = 'http://localhost:4321/', w = '1440', h = '900', scrollTo] = process.argv;

const port = 9700 + Math.floor(Math.random() * 200);
const chrome = spawn(CHROME, [
  '--headless=new',
  '--disable-gpu',
  `--remote-debugging-port=${port}`,
  `--window-size=${w},${h}`,
  '--user-data-dir=' + process.env.TEMP + '/imi-contrast-' + port,
  'about:blank',
]);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

let page;
for (let i = 0; i < 60 && !page; i++) {
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

await send('Page.enable');
await send('Runtime.enable');
await send('Page.navigate', { url });
await sleep(2600);
await send('Runtime.evaluate', {
  expression:
    "document.querySelectorAll('[data-reveal]').forEach(e=>e.classList.add('is-revealed'))",
});
// Optionally park the viewport over a section, so states that only exist
// while scrolled — the header inverted over a cream room — get measured too.
if (scrollTo) {
  await send('Runtime.evaluate', {
    expression: `(()=>{const e=document.querySelector('${scrollTo}');
      if(e) window.scrollTo({top: e.getBoundingClientRect().top + window.scrollY + 200, behavior:'instant'});})()`,
  });
  await sleep(700);
}
await sleep(400);

const EXPR = `
(() => {
  const parse = (c) => {
    const m = c.match(/rgba?\\(([^)]+)\\)/);
    if (!m) return null;
    const p = m[1].split(',').map(Number);
    return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 };
  };
  const lum = ({ r, g, b }) => {
    const f = (v) => {
      v /= 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    };
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
  };
  const ratio = (a, b) => {
    const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
    return (x + 0.05) / (y + 0.05);
  };
  const bgOf = (el) => {
    let n = el;
    while (n && n !== document.documentElement) {
      const c = parse(getComputedStyle(n).backgroundColor);
      if (c && c.a > 0.95) return c;
      n = n.parentElement;
    }
    return { r: 12, g: 12, b: 11, a: 1 };
  };

  const out = [];
  for (const el of document.querySelectorAll('body *')) {
    // Only elements that render their own text.
    const own = [...el.childNodes].some(
      (n) => n.nodeType === 3 && n.textContent.trim().length > 1,
    );
    if (!own) continue;
    const cs = getComputedStyle(el);
    if (cs.visibility === 'hidden' || cs.display === 'none' || +cs.opacity === 0) continue;
    const rect = el.getBoundingClientRect();
    if (rect.width < 2 || rect.height < 2) continue;

    const fg = parse(cs.color);
    const bg = bgOf(el);
    if (!fg) continue;

    const px = parseFloat(cs.fontSize);
    const bold = +cs.fontWeight >= 700;
    const large = px >= 24 || (bold && px >= 18.66);
    const r = ratio(fg, bg);
    const need = large ? 3 : 4.5;

    // The specific trap: --gold as text on a light surface.
    const isGold = Math.abs(fg.r - 200) < 12 && Math.abs(fg.g - 165) < 12 && Math.abs(fg.b - 81) < 14;
    const lightBg = lum(bg) > 0.4;

    out.push({
      sel: el.tagName.toLowerCase() + (el.className && typeof el.className === 'string'
        ? '.' + el.className.trim().split(/\\s+/).slice(0, 2).join('.') : ''),
      text: (el.textContent || '').trim().slice(0, 42),
      fg: cs.color, bg: 'rgb(' + bg.r + ',' + bg.g + ',' + bg.b + ')',
      px: Math.round(px), large, ratio: Math.round(r * 100) / 100, need,
      pass: r >= need,
      goldOnLight: isGold && lightBg,
    });
  }
  return out;
})()
`;

const res = await send('Runtime.evaluate', {
  expression: `JSON.stringify(${EXPR})`,
  returnByValue: true,
});
const rows = JSON.parse(res.result.value);

const fails = rows.filter((r) => !r.pass);
const gold = rows.filter((r) => r.goldOnLight);

console.log(`\nContrast audit — ${url} @ ${w}px`);
console.log(`  ${rows.length} text elements measured`);

if (gold.length) {
  console.log(`\n  GOLD ON LIGHT (§6.2 prohibition) — ${gold.length}`);
  for (const g of gold) console.log(`    ${g.sel}  "${g.text}"  ${g.fg} on ${g.bg}`);
} else {
  console.log('  gold-on-light: none');
}

if (fails.length) {
  console.log(`\n  BELOW WCAG AA — ${fails.length}`);
  for (const f of fails) {
    console.log(
      `    ${f.ratio}:1 (needs ${f.need}) ${f.px}px  ${f.sel}\n      "${f.text}"  ${f.fg} on ${f.bg}`,
    );
  }
} else {
  console.log('  WCAG AA: all pass');
}

const worst = [...rows].sort((a, b) => a.ratio - b.ratio).slice(0, 5);
console.log('\n  tightest ratios:');
for (const r of worst) console.log(`    ${r.ratio}:1  ${r.px}px  ${r.sel}  "${r.text.slice(0, 30)}"`);

ws.close();
chrome.kill();
process.exit(fails.length + gold.length === 0 ? 0 : 1);
