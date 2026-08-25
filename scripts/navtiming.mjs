/**
 * Measures what a client-side route change actually costs, broken into phases,
 * with optional CPU throttling to stand in for a mid-range phone.
 *
 * Reports, from the moment the link is clicked:
 *   swap      — astro:after-swap, the new DOM is in place
 *   pageLoad  — astro:page-load, scripts re-initialised
 *   revealed  — the first above-the-fold [data-reveal] got .is-revealed
 *   visible   — that element's computed opacity actually reached 1
 *
 * Usage: node scripts/navtiming.mjs [baseUrl] [width] [cpuThrottle]
 */
import { spawn } from 'node:child_process';

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const [, , base = 'http://localhost:4321', w = '390', cpu = '1', rttMs = '0'] = process.argv;

const port = 9300 + Math.floor(Math.random() * 200);
const chrome = spawn(CHROME, [
  '--headless=new',
  '--disable-gpu',
  `--remote-debugging-port=${port}`,
  `--window-size=${w},844`,
  '--user-data-dir=' + process.env.TEMP + '/imi-t-' + port,
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
const ev = async (expr) => {
  const r = await send('Runtime.evaluate', {
    expression: `JSON.stringify((()=>{${expr}})())`,
    returnByValue: true,
    awaitPromise: true,
  });
  return r.result?.value ? JSON.parse(r.result.value) : null;
};

await send('Page.enable');
await send('Runtime.enable');
await send('Emulation.setDeviceMetricsOverride', {
  width: Number(w),
  height: 844,
  deviceScaleFactor: 1,
  mobile: Number(w) < 700,
});
if (Number(cpu) > 1) {
  await send('Emulation.setCPUThrottlingRate', { rate: Number(cpu) });
}
// Latency is what prefetch actually hides; on localhost there is none to hide.
if (Number(rttMs) > 0) {
  await send('Network.enable');
  await send('Emulation.setBlockedURLs', { urls: [] });
  await send('Network.emulateNetworkConditions', {
    offline: false,
    latency: Number(rttMs),
    downloadThroughput: (4 * 1024 * 1024) / 8,
    uploadThroughput: (1 * 1024 * 1024) / 8,
  });
}

await send('Page.navigate', { url: base + '/' });
await sleep(3000);

const INSTRUMENT = `
  window.__t = { marks: {} };
  const mark = (k) => { if (window.__t.marks[k] === undefined)
    window.__t.marks[k] = performance.now() - window.__t.t0; };
  document.addEventListener('astro:before-preparation', () => mark('prepStart'));
  document.addEventListener('astro:after-preparation', () => mark('fetched'));
  document.addEventListener('astro:before-swap', () => mark('swapStart'));
  document.addEventListener('astro:after-swap', () => mark('swap'));
  document.addEventListener('astro:page-load', () => {
    mark('pageLoad');
    const el = [...document.querySelectorAll('[data-reveal]')]
      .find(e => e.getBoundingClientRect().top < innerHeight);
    if (!el) { mark('revealed'); mark('visible'); return; }
    if (parseFloat(getComputedStyle(el).opacity) >= 0.99) {
      mark('revealed'); mark('visible'); return;
    }
    window.__t.el = el;
    const obs = new MutationObserver(() => {
      if (el.classList.contains('is-revealed')) { mark('revealed'); obs.disconnect(); }
    });
    obs.observe(el, { attributes: true, attributeFilter: ['class'] });
    const poll = setInterval(() => {
      if (parseFloat(getComputedStyle(el).opacity) >= 0.99) {
        mark('visible'); clearInterval(poll);
      }
    }, 16);
    setTimeout(() => { mark('revealed'); mark('visible'); clearInterval(poll); }, 5000);
  });
  return 1;
`;

async function run(href, label) {
  await ev(INSTRUMENT);
  await ev(`
    window.__t.t0 = performance.now();
    // The desktop link row is display:none on phones, so fall back to the
    // overlay's link. A programmatic click still bubbles and ClientRouter
    // still intercepts it, which is the path being measured.
    const link = document.querySelector('a.header__link[href="${href}"]')
      || document.querySelector('a.mobile-nav__link[href="${href}"]');
    if (!link) return { error: 'no link for ${href}' };
    link.click();
    return 1;
  `);
  await sleep(3200);
  const m = await ev('return window.__t.marks;');
  const f = (v) => (v === undefined ? '   —  ' : String(Math.round(v)).padStart(5) + 'ms');
  console.log(
    `${label.padEnd(18)} fetch ${f(m.fetched)} | swapStart ${f(m.swapStart)} | swapped ${f(m.swap)} | pageLoad ${f(m.pageLoad)} | VISIBLE ${f(m.visible)}`,
  );
  return m;
}

console.log(
  `\n${base}  @${w}px  CPU throttle ${cpu}x  — time from click to content on screen`,
);
await run('/about', 'home -> about');
await run('/', 'about -> home');
await run('/gallery', 'home -> gallery');

ws.close();
chrome.kill();
process.exit(0);
