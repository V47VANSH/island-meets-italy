/**
 * PDF vector artwork -> SVG paths. Dependency-free.
 *
 * Written rather than reached for because this machine has no Ghostscript,
 * Inkscape or poppler, and pdf.js dropped its SVG backend in v4.
 *
 * It reads the page content stream and emits ONLY path geometry. Text-showing
 * operators are deliberately not implemented, so a restricted font can never
 * reach the output — the "no <text> elements, no font references" requirement
 * holds by construction, not by inspection afterwards.
 *
 * Handles: q/Q, cm, w, colour (g/rg/k and the CS/SCN equivalents), path
 * construction (m l c v y h re) and painting (S s f F f* B B* b b* n). Clipping
 * (W/W*) is parsed and ignored — the brand artwork does not rely on it.
 *
 * Usage: node scripts/pdf2svg.mjs "<in.pdf>" <page> "<out.svg>"
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { inflateSync } from 'node:zlib';

const [, , file, pageArg = '1', out = 'out.svg'] = process.argv;
const pageNo = Number(pageArg);
const buf = readFileSync(file);
const raw = buf.toString('latin1');

// ── objects ─────────────────────────────────────────────────────────────
/** Scan for `N G obj … endobj`. Robust enough for well-formed exports. */
const objects = new Map();
const objRe = /(\d+)\s+(\d+)\s+obj\b/g;
let m;
while ((m = objRe.exec(raw))) {
  const id = Number(m[1]);
  const start = m.index + m[0].length;
  const end = raw.indexOf('endobj', start);
  if (end === -1) continue;
  objects.set(id, { start, end, body: raw.slice(start, end) });
}

const derefRe = /^\s*(\d+)\s+\d+\s+R\s*$/;
const deref = (v) => {
  const d = typeof v === 'string' && v.match(derefRe);
  return d ? objects.get(Number(d[1]))?.body ?? '' : v;
};

/** Inflate an object's stream, honouring FlateDecode. */
function streamOf(id) {
  const o = objects.get(id);
  if (!o) return null;
  const sIdx = raw.indexOf('stream', o.start);
  if (sIdx === -1 || sIdx > o.end) return null;
  let p = sIdx + 6;
  if (raw[p] === '\r') p++;
  if (raw[p] === '\n') p++;
  const dict = raw.slice(o.start, sIdx);

  let len = null;
  const lm = dict.match(/\/Length\s+(\d+)(?!\s+\d+\s+R)/);
  if (lm) len = Number(lm[1]);
  else {
    const lr = dict.match(/\/Length\s+(\d+)\s+\d+\s+R/);
    if (lr) {
      const t = objects.get(Number(lr[1]))?.body ?? '';
      const n = t.match(/(\d+)/);
      if (n) len = Number(n[1]);
    }
  }
  let bytes =
    len !== null
      ? buf.subarray(p, p + len)
      : buf.subarray(p, raw.indexOf('endstream', p));

  if (/\/FlateDecode/.test(dict)) {
    try {
      bytes = inflateSync(bytes);
    } catch {
      // Trailing junk after the deflate block is common; retry leniently.
      try {
        bytes = inflateSync(bytes, { finishFlush: 2 });
      } catch {
        return null;
      }
    }
  }
  return bytes.toString('latin1');
}

// ── locate the page ─────────────────────────────────────────────────────
const pageIds = [];
for (const [id, o] of objects) {
  if (/\/Type\s*\/Page[^s]/.test(o.body)) pageIds.push(id);
}
pageIds.sort((a, b) => a - b);
const pageId = pageIds[pageNo - 1];
if (pageId === undefined) {
  console.error(`page ${pageNo} not found (found ${pageIds.length})`);
  process.exit(1);
}
const page = objects.get(pageId).body;

const boxMatch =
  page.match(/\/MediaBox\s*\[([^\]]+)\]/) ??
  raw.match(/\/MediaBox\s*\[([^\]]+)\]/);
const [bx0, by0, bx1, by1] = boxMatch[1].trim().split(/\s+/).map(Number);
const W = bx1 - bx0;
const H = by1 - by0;

// Content may be one stream or an array of them.
let content = '';
const cm = page.match(/\/Contents\s+(\d+)\s+\d+\s+R/);
const ca = page.match(/\/Contents\s*\[([^\]]+)\]/);
if (cm) content = streamOf(Number(cm[1])) ?? '';
else if (ca) {
  for (const r of ca[1].matchAll(/(\d+)\s+\d+\s+R/g)) {
    content += (streamOf(Number(r[1])) ?? '') + '\n';
  }
}
if (!content) {
  console.error('no content stream recovered');
  process.exit(1);
}

// ── tokenise ────────────────────────────────────────────────────────────
const toks = [];
{
  const re =
    /(<<|>>|\[|\]|\/[^\s/<>\[\]()]+|\((?:\\.|[^\\()])*\)|<[0-9A-Fa-f\s]*>|[-+]?[\d.]+|[A-Za-z'"*]+)/g;
  let t;
  while ((t = re.exec(content))) toks.push(t[1]);
}

// ── replay ──────────────────────────────────────────────────────────────
const mul = (a, b) => [
  a[0] * b[0] + a[1] * b[2],
  a[0] * b[1] + a[1] * b[3],
  a[2] * b[0] + a[3] * b[2],
  a[2] * b[1] + a[3] * b[3],
  a[4] * b[0] + a[5] * b[2] + b[4],
  a[4] * b[1] + a[5] * b[3] + b[5],
];
const apply = (mx, x, y) => [
  mx[0] * x + mx[2] * y + mx[4],
  mx[1] * x + mx[3] * y + mx[5],
];

const hex = (r, g, b) =>
  '#' +
  [r, g, b]
    .map((v) => Math.round(Math.max(0, Math.min(1, v)) * 255).toString(16).padStart(2, '0'))
    .join('');
const cmyk = (c, mm, y, k) => hex((1 - c) * (1 - k), (1 - mm) * (1 - k), (1 - y) * (1 - k));

let ctm = [1, 0, 0, 1, 0, 0];
let fill = '#000000';
let stroke = '#000000';
let lw = 1;
const stack = [];
const ops = [];
let cur = '';
let started = false;
let sx = 0;
let sy = 0;

const num = (i) => Number(toks[i]);
const P = (x, y) => {
  const [px, py] = apply(ctm, x, y);
  // PDF origin is bottom-left; SVG is top-left.
  return `${(px - bx0).toFixed(2)} ${(by1 - py).toFixed(2)}`;
};

for (let i = 0; i < toks.length; i++) {
  const t = toks[i];
  switch (t) {
    case 'q':
      stack.push({ ctm, fill, stroke, lw });
      break;
    case 'Q': {
      const s = stack.pop();
      if (s) ({ ctm, fill, stroke, lw } = s);
      break;
    }
    case 'cm':
      ctm = mul(
        [num(i - 6), num(i - 5), num(i - 4), num(i - 3), num(i - 2), num(i - 1)],
        ctm,
      );
      break;
    case 'w':
      lw = num(i - 1);
      break;
    case 'g':
      fill = hex(num(i - 1), num(i - 1), num(i - 1));
      break;
    case 'G':
      stroke = hex(num(i - 1), num(i - 1), num(i - 1));
      break;
    case 'rg':
    case 'sc':
    case 'scn':
      if (!isNaN(num(i - 3))) fill = hex(num(i - 3), num(i - 2), num(i - 1));
      else if (!isNaN(num(i - 1))) fill = hex(num(i - 1), num(i - 1), num(i - 1));
      break;
    case 'RG':
    case 'SC':
    case 'SCN':
      if (!isNaN(num(i - 3))) stroke = hex(num(i - 3), num(i - 2), num(i - 1));
      else if (!isNaN(num(i - 1))) stroke = hex(num(i - 1), num(i - 1), num(i - 1));
      break;
    case 'k':
      fill = cmyk(num(i - 4), num(i - 3), num(i - 2), num(i - 1));
      break;
    case 'K':
      stroke = cmyk(num(i - 4), num(i - 3), num(i - 2), num(i - 1));
      break;

    case 'm':
      sx = num(i - 2);
      sy = num(i - 1);
      cur += `M${P(sx, sy)}`;
      started = true;
      break;
    case 'l':
      if (started) cur += `L${P(num(i - 2), num(i - 1))}`;
      break;
    case 'c':
      if (started)
        cur += `C${P(num(i - 6), num(i - 5))} ${P(num(i - 4), num(i - 3))} ${P(num(i - 2), num(i - 1))}`;
      break;
    case 'v':
      if (started)
        cur += `S${P(num(i - 4), num(i - 3))} ${P(num(i - 2), num(i - 1))}`;
      break;
    case 'y':
      if (started)
        cur += `C${P(num(i - 4), num(i - 3))} ${P(num(i - 2), num(i - 1))} ${P(num(i - 2), num(i - 1))}`;
      break;
    case 'h':
      if (started) cur += 'Z';
      break;
    case 're': {
      const x = num(i - 4);
      const y = num(i - 3);
      const w = num(i - 2);
      const h = num(i - 1);
      cur += `M${P(x, y)}L${P(x + w, y)}L${P(x + w, y + h)}L${P(x, y + h)}Z`;
      started = true;
      break;
    }

    case 'S':
    case 's':
    case 'f':
    case 'F':
    case 'f*':
    case 'B':
    case 'B*':
    case 'b':
    case 'b*':
    case 'n': {
      if (cur.trim()) {
        const closes = t === 's' || t === 'b' || t === 'b*';
        const strokes = /^[SsBb]/.test(t);
        const fills = /^[fFBb]/.test(t);
        if (t !== 'n' && (strokes || fills)) {
          // Scale the stroke width by the CTM so it survives the transform.
          const sc = Math.sqrt(Math.abs(ctm[0] * ctm[3] - ctm[1] * ctm[2])) || 1;
          ops.push({
            d: cur + (closes ? 'Z' : ''),
            fill: fills ? fill : 'none',
            stroke: strokes ? stroke : 'none',
            lw: strokes ? Math.max(0.1, lw * sc) : 0,
            evenodd: t.includes('*'),
          });
        }
      }
      cur = '';
      started = false;
      break;
    }
    default:
      break;
  }
}

const body = ops
  .map(
    (o) =>
      `<path d="${o.d}" fill="${o.fill}"` +
      (o.evenodd && o.fill !== 'none' ? ' fill-rule="evenodd"' : '') +
      (o.stroke !== 'none'
        ? ` stroke="${o.stroke}" stroke-width="${o.lw.toFixed(2)}"`
        : '') +
      '/>',
  )
  .join('\n');

writeFileSync(
  out,
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W.toFixed(2)} ${H.toFixed(2)}">\n${body}\n</svg>\n`,
);

console.log(`${out}  ${ops.length} paths  viewBox 0 0 ${W.toFixed(0)} ${H.toFixed(0)}`);
