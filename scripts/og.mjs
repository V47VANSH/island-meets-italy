/**
 * Generates the per-page Open Graph images into public/og/ (§12).
 *
 * Rendered in headless Chrome rather than composed with sharp, so the cards
 * use the real self-hosted Josefin Sans, the official palette and the real
 * outlined wordmark — an OG card in a fallback face looks like another brand.
 *
 * Photography: the arancini for Home (it leads the hero), branzino for Gallery,
 * the author photograph for About and Media. The tagline carries David's own
 * device — Jamaica's green on "Island", Italy's red on "Italian".
 *
 * Re-run after changing tokens, fonts or the source photographs:
 *   node scripts/og.mjs
 */
import { spawn } from 'node:child_process';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import sharp from 'sharp';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const OUT = join(root, 'public', 'og');

/** Tokens, duplicated here only because this renders outside the site build. */
const T = {
  ink: '#0C0C0B',
  cream: '#FBF8F3',
  gold: '#C29B4E',
  goldLight: '#E6C161',
  goldDeep: '#7F6127',
  maroon: '#6D0000',
  green: '#009548',
  red: '#DE2128',
  onDark: '#F3EFE8',
  onDarkMute: '#A8A399',
};

const CARDS = [
  { file: 'default.jpg', photo: 'food/oxtail-arancini.jpg', kicker: 'Island Meets Italy', title: 'Where Island Soul meets Italian Heart', focus: '52% 68%', mark: true },
  { file: 'home.jpg', photo: 'food/oxtail-arancini.jpg', kicker: 'Island Meets Italy', title: 'Where Island Soul meets Italian Heart', focus: '52% 68%', mark: true },
  { file: 'gallery.jpg', photo: 'food/branzino.jpg', kicker: 'From the Kitchen', title: 'Jamaican soul. Italian tradition.', focus: '50% 45%' },
  { file: 'about.jpg', photo: 'chef/kenton-lowrie.jpg', kicker: 'Chef Kenton Lowrie', title: 'A Career Built in the Kitchen', focus: '50% 28%' },
  { file: 'media.jpg', photo: 'chef/kenton-lowrie.jpg', kicker: 'Chef Kenton Lowrie', title: 'Media & Press', focus: '50% 28%' },
  { file: 'cookbook.jpg', photo: null, kicker: 'The Debut Cookbook', title: 'Volume 1 — Foundations of Flavor', focus: null },
  { file: 'contact.jpg', photo: null, kicker: 'Island Meets Italy', title: 'Get in Touch', focus: null },
];

const dataUri = async (rel) => {
  const buf = await readFile(join(root, 'src', 'assets', rel));
  const jpg = await sharp(buf).resize({ width: 900 }).jpeg({ quality: 82 }).toBuffer();
  return `data:image/jpeg;base64,${jpg.toString('base64')}`;
};

const fontUri = async (name) => {
  const buf = await readFile(join(root, 'public', 'fonts', name));
  return `data:font/woff2;base64,${buf.toString('base64')}`;
};

/** The real wordmark, inlined as outlined paths. */
const wordmarkSvg = await readFile(
  join(root, 'src', 'assets', 'brand', 'wordmark.svg'),
  'utf8',
);

function html(card, photoSrc, josefin, inter) {
  // Split hero card: type left of the gold meeting line, photograph right —
  // the same structure as the site, so a shared link looks like the site.
  const photo = photoSrc
    ? `<div class="photo"><img src="${photoSrc}" style="object-position:${card.focus}"></div>`
    : '';
  return `<!doctype html><meta charset="utf-8"><style>
  @font-face{font-family:J;src:url(${josefin}) format('woff2');font-weight:300 700}
  @font-face{font-family:I;src:url(${inter}) format('woff2');font-weight:300 800}
  *{margin:0;padding:0;box-sizing:border-box}
  body{width:1200px;height:630px;background:${T.ink};color:${T.onDark};
       display:grid;grid-template-columns:${photoSrc ? '1fr 460px' : '1fr'};overflow:hidden}
  .type{padding:76px 64px;display:flex;flex-direction:column;justify-content:center;position:relative}
  .kicker{font-family:J;font-size:19px;font-weight:600;text-transform:uppercase;
          letter-spacing:.16em;color:${T.gold};margin-bottom:26px}
  .logo{width:${photoSrc ? 400 : 520}px;color:${T.gold};margin-bottom:26px}
  .logo svg{width:100%;height:auto;display:block}
  h1{font-family:J;font-weight:300;
     font-size:${card.title.length > 34 ? 44 : 60}px;line-height:1.18;letter-spacing:.01em;
     color:${T.onDark};max-width:18ch}
  h1 .g{color:${T.green}}
  h1 .r{color:${T.red}}
  h1 .w{color:${T.gold}}
  .foot{position:absolute;left:64px;bottom:64px;font-family:J;font-size:17px;font-weight:600;
        text-transform:uppercase;letter-spacing:.16em;color:${T.onDarkMute}}
  .rule{position:absolute;top:0;bottom:0;width:1px;background:rgba(200,165,81,.4)}
  .photo{position:relative;overflow:hidden}
  .photo img{width:100%;height:100%;object-fit:cover;display:block}
  </style>
  <div class="type">
    ${card.mark ? `<div class="logo">${wordmarkSvg}</div>` : `<div class="kicker">${card.kicker}</div>`}
    <h1>${
      // David's tagline device, in the card too: Jamaica's green, Italy's red.
      card.title
        .replace(/&/g, '&amp;')
        .replace(/Island/, '<span class="g">Island</span>')
        .replace(/Italian/, '<span class="r">Italian</span>')
        .replace(/(Where|Soul|Heart|meets)/g, '<span class="w">$1</span>')
    }</h1>
    <div class="foot">islandmeetsitaly.com</div>
    ${photoSrc ? `<span class="rule" style="right:0"></span>` : ''}
  </div>
  ${photo}`;
}

// ── drive Chrome ────────────────────────────────────────────────────────
const port = 9800 + Math.floor(Math.random() * 150);
const chrome = spawn(CHROME, [
  '--headless=new',
  '--disable-gpu',
  `--remote-debugging-port=${port}`,
  '--window-size=1200,630',
  '--user-data-dir=' + process.env.TEMP + '/imi-og-' + port,
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
await send('Emulation.setDeviceMetricsOverride', {
  width: 1200,
  height: 630,
  deviceScaleFactor: 1,
  mobile: false,
});

await mkdir(OUT, { recursive: true });
const josefin = await fontUri('josefin-latin.woff2');
const inter = await fontUri('inter-latin.woff2');

for (const card of CARDS) {
  const photoSrc = card.photo ? await dataUri(card.photo) : null;
  const markup = html(card, photoSrc, josefin, inter);

  await send('Page.navigate', {
    url: 'data:text/html;base64,' + Buffer.from(markup).toString('base64'),
  });
  await sleep(900);

  const shot = await send('Page.captureScreenshot', { format: 'png' });
  const png = Buffer.from(shot.data, 'base64');
  await sharp(png).jpeg({ quality: 86, mozjpeg: true }).toFile(join(OUT, card.file));
  console.log(`public/og/${card.file}`);
}

ws.close();
chrome.kill();
process.exit(0);
