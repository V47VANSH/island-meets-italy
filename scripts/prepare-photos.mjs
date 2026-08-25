/**
 * Asset prep — the four approved food photographs.
 *
 * The files delivered in `resources/` are Android screenshots (1080x2340) of a
 * gallery viewer, not the original photographs. Each contains the real image at
 * 1080x1440 (3:4 portrait) starting at y=450; the rest is status bar, filename
 * header and letterboxing. This script strips that chrome and applies the light,
 * consistent grade called for in the build context §5.2 — subtle contrast lift,
 * slightly warm midtones, no heavy filter.
 *
 * `resources/` is read-only. Output lands in src/assets/food/.
 * Re-run with `node scripts/prepare-photos.mjs` when the hi-res originals arrive
 * (drop CROP once they do — originals have no chrome to remove).
 *
 * Usage: node scripts/prepare-photos.mjs
 */
import sharp from 'sharp';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = join(root, 'resources');
const OUT = join(root, 'src', 'assets', 'food');

/** Photo region inside the delivered screenshots. Verified per-file. */
const CROP = { left: 0, top: 450, width: 1080, height: 1440 };

const PHOTOS = [
  { from: '1000014823.jpg', to: 'branzino.jpg' },
  { from: '1000014825.jpg', to: 'panna-cotta.jpg' },
  { from: '1000014827.jpg', to: 'mango-caprese.jpg' },
  { from: '1000014829.jpg', to: 'oxtail-arancini.jpg' },
];

/** Light consistent grade. Per-channel linear warms the midtones without a filter look. */
const grade = (pipeline) =>
  pipeline
    .linear([1.06, 1.045, 1.015], [-6, -6, -3])
    .modulate({ saturation: 1.05 });

for (const { from, to } of PHOTOS) {
  await grade(sharp(join(SRC, from)).extract(CROP))
    .jpeg({ quality: 95, chromaSubsampling: '4:4:4', mozjpeg: true })
    .toFile(join(OUT, to));
  console.log(`${from} -> src/assets/food/${to}`);
}
