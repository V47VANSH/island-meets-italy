/**
 * Build-time audit against the non-negotiables in the build context.
 *
 * The approved copy in §4 is compared against
 * resources/island-meets-italy-BUILD-CONTEXT.md itself rather than a retyped
 * copy, so this check cannot drift from the source of truth.
 *
 * Home-page copy is only checked on the home route. The universal rules run on
 * every route: no telephone number (§4.7), no empty or "coming soon" states
 * (§10), descriptive alt text (§11), valid JSON-LD with no nulls (§12), and
 * exactly one <h1> with title, description and canonical (§12).
 *
 * Usage: node scripts/audit.mjs [baseUrl] [...routes]
 */
import { readFileSync } from 'node:fs';

const SOURCE_OF_TRUTH = 'resources/island-meets-italy-BUILD-CONTEXT.md';

let src;
try {
  src = readFileSync(SOURCE_OF_TRUTH, 'utf8');
} catch {
  console.error(
    [
      '',
      `Cannot audit: ${SOURCE_OF_TRUTH} is missing.`,
      'The approved copy is compared against that file rather than a retyped',
      'copy, so it has to stay in the repository for this check to mean anything.',
      '',
    ].join('\n'),
  );
  process.exit(1);
}

/** Pull the approved copy straight out of the source of truth. */
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

const homeBlocks = [
  ...approved('**Hero**', 'Buttons: `EXPLORE THE COOKBOOK`'),
  ...approved('**Brand introduction**', 'Button: `DISCOVER ISLAND MEETS ITALY`'),
  ...approved('**Cookbook feature**', 'Buttons: `DISCOVER THE BOOK`'),
  ...approved('**Food feature**', 'Client instruction:'),
];

const homeButtons = [
  'EXPLORE THE COOKBOOK',
  'MEET CHEF KENTON',
  'DISCOVER ISLAND MEETS ITALY',
  'DISCOVER THE BOOK',
  'BUY THE BOOK',
];

const footerLines = [
  'Where Island Soul Meets Italian Heart',
  'Chef Kenton Lowrie — Professional Chef • Author • Founder',
  '© 2026 Island Meets Italy Inc. All Rights Reserved.',
];

/** Routes carrying a Book node in their JSON-LD (§12). */
const BOOK_ROUTES = new Set(['/', '/cookbook']);

const base = (process.argv[2] ?? 'http://localhost:4321/').replace(/\/$/, '');
const routes =
  process.argv.length > 3
    ? process.argv.slice(3)
    : ['/', '/about', '/cookbook', '/gallery', '/media', '/contact'];

let failures = 0;

function check(label, ok, detail = '') {
  if (ok) return;
  failures++;
  console.log(`  FAIL  ${label}`);
  if (detail) console.log(`        ${detail}`);
}

/** Visible text: tags stripped, entities decoded, whitespace collapsed. */
function visibleText(html) {
  return html
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
}

const norm = (s) => s.replace(/\s+/g, ' ').trim();

function auditPage(route, html) {
  const text = visibleText(html);

  if (route === '/') {
    for (const line of homeBlocks) {
      const needle = norm(line);
      if (needle === 'ISLAND MEETS ITALY') continue; // wordmark, checked below

      // Lines the client wrote in caps render in sentence case and are
      // uppercased with CSS — identical on screen, and kinder to screen
      // readers, which otherwise spell literal all-caps out letter by letter.
      const isCaps = needle === needle.toUpperCase() && /[A-Z]{4}/.test(needle);
      const found = isCaps
        ? text.toUpperCase().includes(needle)
        : text.includes(needle);

      const shown = needle.slice(0, 70) + (needle.length > 70 ? '…' : '');
      check(`missing or altered: "${shown}"`, found);
    }

    check('hero wordmark', /Island\s*Meets\s*Italy/i.test(text));

    for (const label of homeButtons) {
      check(
        `button label "${label}"`,
        new RegExp(label.replace(/ /g, '\\s+'), 'i').test(text),
      );
    }
    console.log(
      `  §4   ${homeBlocks.length} copy blocks + ${homeButtons.length} button labels`,
    );
  }

  for (const line of footerLines) check(`footer line "${line}"`, text.includes(line));

  // §4.7 — never a telephone number, anywhere.
  check('no tel: link', !/href\s*=\s*["']tel:/i.test(html));
  const phoneLike = text.match(
    /(?:\+?1[\s.\-]?)?\(?\d{3}\)?[\s.\-]\d{3}[\s.\-]\d{4}/g,
  );
  check('no phone-shaped number', !phoneLike, phoneLike ? phoneLike.join(', ') : '');

  // §10 — nothing empty or placeholder-ish on a public page.
  for (const bad of ['coming soon', 'Coming Soon', 'TBD', 'Lorem ipsum', 'undefined']) {
    check(`no "${bad}" in visible text`, !text.includes(bad));
  }

  // §11 — descriptive alt text on every non-decorative image.
  const imgs = [...html.matchAll(/<img\b[^>]*>/g)].map((m) => m[0]);
  for (const img of imgs) {
    const alt = img.match(/\salt\s*=\s*"([^"]*)"/);
    check('img has an alt attribute', Boolean(alt), img.slice(0, 80));
    if (alt && alt[1] !== '') {
      check(
        'alt is descriptive (> 40 chars)',
        alt[1].length > 40,
        `${alt[1].length} chars: "${alt[1].slice(0, 60)}…"`,
      );
    }
  }

  // §12 — structured data, with nulls omitted rather than emitted.
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
      const types = (parsed['@graph'] ?? []).map((n) => n['@type']);
      check('has Organization', types.includes('Organization'));
      check('has Person', types.includes('Person'));
      if (BOOK_ROUTES.has(route)) check('has Book', types.includes('Book'));
      if (route !== '/') {
        check('interior page has BreadcrumbList', types.includes('BreadcrumbList'));
      }
      const flat = JSON.stringify(parsed);
      check('no null values emitted', !flat.includes(':null'));
      check('no empty strings emitted', !flat.includes(':""'));
    }
  }

  // §12 — head essentials.
  check('has <title>', /<title>[^<]+<\/title>/.test(html));
  check(
    'has meta description',
    /<meta name="description" content="[^"]{40,}"/.test(html),
  );
  check('has canonical', /rel="canonical"/.test(html));
  const h1s = (html.match(/<h1[\s>]/g) || []).length;
  check('exactly one <h1>', h1s === 1, `found ${h1s}`);

  console.log(
    `  §4.7 no phone · §10 no empty states · §11 ${imgs.length} images · §12 schema + head`,
  );
}

for (const route of routes) {
  const res = await fetch(base + route);
  console.log(`\n── ${route}  (${res.status})`);
  check(`${route} responds 200`, res.ok, `got ${res.status}`);
  if (res.ok) auditPage(route, await res.text());
}

console.log(
  failures === 0
    ? '\nAUDIT PASSED — no failures\n'
    : `\nAUDIT: ${failures} failure(s)\n`,
);
process.exit(failures === 0 ? 0 : 1);
