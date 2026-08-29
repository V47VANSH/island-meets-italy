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

/**
 * The author photograph (§14, delivered 29 Aug). Unlike the food photos this
 * is a real hi-res original — 4000x3000 with EXIF orientation 6, i.e. a
 * portrait shot stored sideways. Browsers honour that tag but sharp strips
 * EXIF while processing, so the rotation is baked in here; without it the
 * portrait renders on its side everywhere astro:assets touches it.
 *
 * No colour grade: the grade below exists to rescue phone screenshots, and a
 * warm midtone push on a studio headshot would only shift skin tones.
 */
const PORTRAIT = { from: 'kenton.jpg', to: 'chef/kenton-lowrie.jpg' };

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

// `.rotate()` with no argument applies the EXIF orientation, then the tag is
// dropped along with the rest of the metadata.
await sharp(join(SRC, PORTRAIT.from))
  .rotate()
  .resize({ width: 2000, withoutEnlargement: true })
  .jpeg({ quality: 92, chromaSubsampling: '4:4:4', mozjpeg: true })
  .toFile(join(root, 'src', 'assets', PORTRAIT.to));
console.log(`${PORTRAIT.from} -> src/assets/${PORTRAIT.to}`);
