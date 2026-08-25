/**
 * Dev-review helper: drives headless Chrome over CDP to take full-page
 * screenshots at a given width and to read back computed geometry.
 *
 * Not part of the site build. Used to check work in the browser against §6.
 *
 * Usage:
 *   node scripts/shoot.mjs <url> <out.png> <width> <height> [--full] [--eval "expr"]
 */
import { spawn } from 'node:child_process';
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const [, , url, out, w = '1440', h = '900', ...rest] = process.argv;
const full = rest.includes('--full');
const scrollIdx = rest.indexOf('--scroll');
const scrollTo = scrollIdx !== -1 ? Number(rest[scrollIdx + 1]) : null;
const selIdx = rest.indexOf('--to');
const selector = selIdx !== -1 ? rest[selIdx + 1] : null;
const evalIdx = rest.indexOf('--eval');
const expr = evalIdx !== -1 ? rest[evalIdx + 1] : null;

const port = 9200 + Math.floor(Math.random() * 500);
const chrome = spawn(CHROME, [
  '--headless=new',
  '--disable-gpu',
  '--hide-scrollbars',
  `--remote-debugging-port=${port}`,
  `--window-size=${w},${h}`,
  '--user-data-dir=' + process.env.TEMP + '/imi-chrome-' + port,
  'about:blank',
]);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function targets() {
  for (let i = 0; i < 60; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/json/list`);
      const list = await res.json();
      const page = list.find((t) => t.type === 'page');
      if (page) return page;
    } catch {}
    await sleep(250);
  }
  throw new Error('Chrome did not come up');
}

const page = await targets();
const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((r) => (ws.onopen = r));

let id = 0;
const pending = new Map();
const logs = [];
ws.onmessage = (e) => {
  const msg = JSON.parse(e.data);
  if (msg.method === 'Runtime.exceptionThrown') {
    logs.push('EXCEPTION: ' + (msg.params.exceptionDetails.exception?.description ||
      msg.params.exceptionDetails.text));
  }
  if (msg.method === 'Runtime.consoleAPICalled' && ['error', 'warning'].includes(msg.params.type)) {
    logs.push(msg.params.type.toUpperCase() + ': ' +
      msg.params.args.map((a) => a.description || a.value).join(' '));
  }
  if (msg.id && pending.has(msg.id)) {
    pending.get(msg.id)(msg.result);
    pending.delete(msg.id);
  }
};
const send = (method, params = {}) =>
  new Promise((resolve) => {
    const n = ++id;
    pending.set(n, resolve);
    ws.send(JSON.stringify({ id: n, method, params }));
  });

await send('Page.enable');
await send('Runtime.enable');
await send('Emulation.setDeviceMetricsOverride', {
  width: Number(w),
  height: Number(h),
  deviceScaleFactor: 1,
  mobile: Number(w) < 700,
});
await send('Page.navigate', { url });
await sleep(2500);

// Settle scroll reveals so nothing is screenshotted mid-transition, and hide
// Astro's dev toolbar so it is not mistaken for part of the design.
await send('Runtime.evaluate', {
  expression: `
    const s = document.createElement('style');
    // scroll-behavior: smooth would leave captures mid-animation.
    s.textContent = 'astro-dev-toolbar{display:none !important}' +
      'html{scroll-behavior:auto !important}';
    document.head.appendChild(s);
    document.querySelectorAll('[data-reveal]').forEach(el => el.classList.add('is-revealed'));
    window.scrollTo(0, document.body.scrollHeight);
  `,
});
await sleep(700);
await send('Runtime.evaluate', { expression: 'window.scrollTo(0,0)' });
await sleep(500);

// Scroll to a pixel offset or to a selector. Full-page capture is avoided on
// purpose: resizing the viewport to the document height re-resolves every svh
// unit, which silently rebuilds the layout being reviewed.
if (scrollTo !== null) {
  await send('Runtime.evaluate', { expression: `window.scrollTo(0, ${scrollTo})` });
  await sleep(600);
}
if (selector) {
  await send('Runtime.evaluate', {
    expression: `(()=>{const e=document.querySelector('${selector}');
      if(e) window.scrollTo(0, e.getBoundingClientRect().top + window.scrollY);})()`,
  });
  await sleep(600);
}

if (expr) {
  const r = await send('Runtime.evaluate', {
    expression: `JSON.stringify((()=>{${expr}})(), null, 1)`,
    returnByValue: true,
  });
  console.log(r.result?.value ?? JSON.stringify(r));
}

if (out && out !== '-') {
  if (full) {
    // Resizing the emulated viewport to the document height is more reliable
    // than captureBeyondViewport, which trips over fixed/svh layouts.
    const r = await send('Runtime.evaluate', {
      expression: 'document.documentElement.scrollHeight',
      returnByValue: true,
    });
    await send('Emulation.setDeviceMetricsOverride', {
      width: Number(w),
      height: Math.min(r.result.value, 30000),
      deviceScaleFactor: 1,
      mobile: Number(w) < 700,
    });
    await sleep(900);
  }
  const shot = await send('Page.captureScreenshot', { format: 'png' });
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, Buffer.from(shot.data, 'base64'));
  console.log(`${out} written`);
}

if (logs.length) console.log('--- console ---'); logs.forEach((l) => console.log(l));

ws.close();
chrome.kill();
process.exit(0);
