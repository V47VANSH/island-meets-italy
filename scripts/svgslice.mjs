/**
 * Slices one instance out of an extracted brand sheet and normalises it.
 *
 * The logo PDFs are presentation sheets: the mark appears four times in
 * different colourways, plus swatches. This keeps the paths inside a given
 * region, re-origins the viewBox around them, and recolours to currentColor so
 * the mark inverts between ink and cream rooms from CSS alone.
 *
 * Usage:
 *   node scripts/svgslice.mjs <in.svg> <out.svg> <x0> <y0> <x1> <y1> [--keep-fill]
 */
import { readFileSync, writeFileSync } from 'node:fs';

const [, , inFile, outFile, X0, Y0, X1, Y1, ...flags] = process.argv;
const keepFill = flags.includes('--keep-fill');
const box = [Number(X0), Number(Y0), Number(X1), Number(Y1)];

const src = readFileSync(inFile, 'utf8');
const paths = [...src.matchAll(/<path\b[^>]*\/>/g)].map((m) => m[0]);

const attr = (tag, name) => (tag.match(new RegExp(`${name}="([^"]*)"`)) ?? [])[1];

/** Bounding box from the absolute coordinates in a path's `d`. */
function bbox(d) {
  const nums = d.match(/-?\d*\.?\d+/g);
  if (!nums) return null;
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  // Commands here are only M/L/C/S/Z, all absolute, so pairs are x,y.
  for (let i = 0; i + 1 < nums.length; i += 2) {
    const x = Number(nums[i]);
    const y = Number(nums[i + 1]);
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }
  return [minX, minY, maxX, maxY];
}

const kept = [];
for (const tag of paths) {
  const d = attr(tag, 'd');
  if (!d) continue;
  const b = bbox(d);
  if (!b) continue;
  const [x0, y0, x1, y1] = b;
  // Fully inside the requested region.
  if (x0 < box[0] || y0 < box[1] || x1 > box[2] || y1 > box[3]) continue;
  // Drop the full-bleed background rectangles of the sheet.
  const w = x1 - x0;
  const h = y1 - y0;
  if (w > (box[2] - box[0]) * 0.94 && h > (box[3] - box[1]) * 0.94) continue;
  kept.push({ tag, d, b });
}

if (kept.length === 0) {
  console.error('nothing inside that region');
  process.exit(1);
}

// Re-origin around what survived.
let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
for (const k of kept) {
  minX = Math.min(minX, k.b[0]);
  minY = Math.min(minY, k.b[1]);
  maxX = Math.max(maxX, k.b[2]);
  maxY = Math.max(maxY, k.b[3]);
}
const pad = 1;
minX -= pad; minY -= pad; maxX += pad; maxY += pad;

const shift = (d) =>
  d.replace(/(-?\d*\.?\d+)\s+(-?\d*\.?\d+)/g, (_, x, y) =>
    `${(Number(x) - minX).toFixed(2)} ${(Number(y) - minY).toFixed(2)}`,
  );

const body = kept
  .map(({ tag, d }) => {
    const stroke = attr(tag, 'stroke');
    const fill = attr(tag, 'fill');
    const sw = attr(tag, 'stroke-width');
    const parts = [`d="${shift(d)}"`];
    // currentColor everywhere, so one file serves ink and cream (§6.2).
    parts.push(`fill="${fill && fill !== 'none' ? (keepFill ? fill : 'currentColor') : 'none'}"`);
    if (stroke && stroke !== 'none') {
      parts.push(`stroke="currentColor"`, `stroke-width="${sw ?? '1'}"`);
    }
    return `<path ${parts.join(' ')}/>`;
  })
  .join('');

const w = (maxX - minX).toFixed(2);
const h = (maxY - minY).toFixed(2);
writeFileSync(
  outFile,
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" fill="none" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`,
);
console.log(`${outFile}  ${kept.length}/${paths.length} paths  ${w}x${h}`);
