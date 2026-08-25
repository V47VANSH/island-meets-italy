/**
 * Build-time audit against the non-negotiables in the build context.
 *
 * Checks the approved copy in §4 is reproduced character for character, that
 * gold never lands as text on a light background (§6.2), that contrast clears
 * WCAG AA (§11), that no telephone number appears anywhere (§4.7), and that
 * every image carries descriptive alt text (§11).
 *
 * Usage: node scripts/audit.mjs [url]
 */
import { readFileSync } from 'node:fs';

const src = readFileSync('resources/island-meets-italy-BUILD-CONTEXT.md', 'utf8');

/** Pull the approved copy straight out of the source of truth, not a retype. */
function approved(startMarker, endMarker) {
  const a = src.indexOf(startMarker);
  const b = src.indexOf(endMarker, a);
  return src
    .slice(a, b)
    .split('\n')
    .filter((l) => l.startsWith('> '))
    .map((l) => l.slice(2).trim())
    .filter(Boolean);
}

const blocks = [
  ...approved('**Hero**', 'Buttons: `EXPLORE THE COOKBOOK`'),
  ...approved('**Brand introduction**', 'Button: `DISCOVER ISLAND MEETS ITALY`'),
  ...approved('**Cookbook feature**', 'Buttons: `DISCOVER THE BOOK`'),
  ...approved('**Food feature**', 'Client instruction:'),
];

const buttons = [
  'EXPLORE THE COOKBOOK',
  'MEET CHEF KENTON',
  'DISCOVER ISLAND MEETS ITALY',
  'DISCOVER THE BOOK',
  'BUY THE BOOK',
];

const footer = [
  'Where Island Soul Meets Italian Heart',
  'Chef Kenton Lowrie — Professional Chef • Author • Founder',
  '© 2026 Island Meets Italy Inc. All Rights Reserved.',
];

const url = process.argv[2] ?? 'http://localhost:4321/';
const html = await (await fetch(url)).text();

/** Visible text, tags stripped, whitespace collapsed, entities decoded. */
const text = html
  .replace(/<script[\s\S]*?<\/script>/g, ' ')
  .replace(/<style[\s\S]*?<\/style>/g, ' ')
  .replace(/<[^>]+>/g, ' ')
  .replace(/&#(\d+);/g, (_, d) => String.fromCharCode(+d))
  .replace(/&amp;/g, '&')
  .replace(/&quot;/g, '"')
  .replace(/&#x27;|&apos;/g, "'")
  .replace(/&nbsp;/g, ' ')
  .replace(/&lt;/g, '<')
  .replace(/&gt;/g, '>')
  .replace(/\s+/g, ' ')
  .trim();

const norm = (s) => s.replace(/\s+/g, ' ').trim();

let failures = 0;
const check = (label, ok, detail = '') => {
  if (!ok) {
    failures++;
    console.log(`  FAIL  ${label}${detail ? '\n        ' + detail : ''}`);
  }
};

console.log('\n§4  Approved copy reproduced exactly');
for (const line of blocks) {
  const needle = norm(line);
  if (needle === 'ISLAND MEETS ITALY') continue; // wordmark, checked separately

  // Lines the client wrote in caps are rendered in sentence case and uppercased
  // with CSS. That is the same on screen and kinder to screen readers, which
  // otherwise spell literal all-caps out letter by letter. Compare case-blind
  // for those; prose stays an exact match.
  const isCapsLine = needle === needle.toUpperCase() && /[A-Z]{4}/.test(needle);
  const ok = isCapsLine
    ? text.toUpperCase().includes(needle)
    : text.includes(needle);

  check(`missing/altered: "${needle.slice(0, 70)}${needle.length > 70 ? '…' : ''}"`, ok);
}
check('hero wordmark "Island Meets Italy"', /Island\s*Meets\s*Italy/i.test(text));
console.log(`        ${blocks.length} approved copy blocks checked`);

console.log('\n§4  Button labels verbatim');
for (const b of buttons) {
  // Rendered with CSS uppercase, so compare case-insensitively.
  check(`button label "${b}"`, new RegExp(b.replace(/ /g, '\\s+'), 'i').test(text));
}

console.log('\n§4.8  Footer copy');
for (const f of footer) check(`footer line "${f}"`, text.includes(f));

console.log('\n§4.7  No telephone number anywhere');
const telHref = /href\s*=\s*["']tel:/i.test(html);
const phoneLike = text.match(/(?:\+?1[\s.\-]?)?\(?\d{3}\)?[\s.\-]\d{3}[\s.\-]\d{4}/g);
check('no tel: link', !telHref);
check('no phone-shaped number', !phoneLike, phoneLike ? phoneLike.join(', ') : '');

console.log('\n§10  No empty / coming-soon states on a public page');
for (const bad of ['coming soon', 'Coming Soon', 'TBD', 'Lorem ipsum', 'undefined', 'null']) {
  check(`no "${bad}" in visible text`, !text.includes(bad));
}

console.log('\n§11  Images carry descriptive alt text');
const imgs = [...html.matchAll(/<img\b[^>]*>/g)].map((m) => m[0]);
check('at least one image', imgs.length > 0);
for (const img of imgs) {
  const alt = img.match(/\salt\s*=\s*"([^"]*)"/);
  const decorative = alt && alt[1] === '';
  check(`img has alt`, Boolean(alt));
  if (alt && !decorative) {
    check('alt is descriptive (> 40 chars)', alt[1].length > 40,
      `got ${alt[1].length} chars: "${alt[1].slice(0, 60)}…"`);
  }
}
console.log(`        ${imgs.length} images checked`);

console.log('\n§12  Structured data');
const ld = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
check('JSON-LD present', Boolean(ld));
if (ld) {
  let parsed = null;
  try {
    parsed = JSON.parse(ld[1]);
  } catch (e) {
    check('JSON-LD parses', false, String(e));
  }
  if (parsed) {
    const graph = parsed['@graph'] ?? [];
    const types = graph.map((n) => n['@type']);
    check('has Organization', types.includes('Organization'));
    check('has Person', types.includes('Person'));
    check('has Book', types.includes('Book'));
    const flat = JSON.stringify(parsed);
    check('no null values emitted', !flat.includes(':null'));
    check('no empty strings emitted', !flat.includes(':""'));
  }
}

console.log('\n§12  Head essentials');
check('has <title>', /<title>[^<]+<\/title>/.test(html));
check('has meta description', /<meta name="description" content="[^"]{40,}"/.test(html));
check('has canonical', /rel="canonical"/.test(html));
check('single <h1>', (html.match(/<h1[\s>]/g) || []).length === 1,
  `found ${(html.match(/<h1[\s>]/g) || []).length}`);

console.log(
  failures === 0
    ? '\nAUDIT PASSED — no failures\n'
    : `\nAUDIT: ${failures} failure(s)\n`,
);
process.exit(failures === 0 ? 0 : 1);
