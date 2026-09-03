# Island Meets Italy — Session Context

Working notes from the build sessions. **This is not the source of truth** —
that is `resources/island-meets-italy-BUILD-CONTEXT.md`, which holds the client
requirements, approved copy, page specs and brand system.

This file holds what that document cannot: the decisions taken, the deviations
and why, the traps that cost real time, and the current state.

**Client:** Chef Kenton Lowrie · **Designer:** David · **Build:** Vansh Bansal
**Repo:** `github.com/V47VANSH/island-meets-italy` — **public**

---

## 1. State right now

**Working:** all six pages plus a 404, the full brand system, the contact form
end to end (dev), the motion pass, the accessibility pass.

**Broken:** the Cloudflare deploy fails at build with

```
Rollup failed to resolve import "@/components/brand/Wordmark.astro"
```

**Cause — not a code problem.** These directories are **untracked in git** and
were never pushed. A `git commit -a` only stages files git already knows about:

```
src/components/brand/      Wordmark, Mark, Ornament, Tagline
src/assets/brand/          wordmark.svg, mark.svg, meets.svg
src/assets/book/           cover.jpg
public/fonts/josefin-*     the brand webfont
src/pages/404.astro
scripts/                   pdfkit, pdf2svg, svgslice, wordmark, _svgshot
```

`git add -A` on those paths fixes it. **See §9 before running it** — there is a
licensing decision about `resources/` first.

---

## 2. Stack, and why

| Layer | Choice | Note |
|---|---|---|
| Framework | Astro 5.18.2 | `output: 'static'` |
| Adapter | `@astrojs/cloudflare` **12.6.13** | **Pinned.** 13+ needs Astro 6, 14+ needs Astro 7 |
| Styling | Tailwind v4 via `@tailwindcss/vite` | Tokens in `@theme inline`; bespoke CSS for everything signature |
| Images | `astro:assets` + sharp | AVIF/WebP, responsive srcset |
| Host | **Cloudflare Workers** with static assets | Not Pages — see §8 |
| Forms | Astro endpoint → Resend REST via `fetch` | No SDK, no dependency |

**`@astrojs/react` is installed but deliberately not in `astro.config.mjs`.**
On this Astro/rolldown-vite combination its Fast Refresh wrapper throws
`Missing field moduleType` when transforming Astro's virtual script modules. In
dev that 500s **every** hoisted `<script>` in the project — the header state,
scroll reveals and mobile nav all die silently while `astro build` stays green.

Nothing is a React island today. The mobile nav and contact form are plain
markup plus small scripts. That also keeps the JS budget: react + react-dom is
57 KB gzipped and would blow §13's 40 KB limit on its own.

If Phase 5 wants React, re-add `react()` and check dev still serves
`/src/**/*.astro?astro&type=script`. If it 500s, this is why.

---

## 3. The trap that cost the most time

**Astro scopes a component's CSS to its own template.** A class passed *into* a
child component lands on that child's root element, which carries the **child's**
scope id — so the parent's rule never matches. It fails silently.

```astro
<!-- Parent.astro -->
<Section class="hero">…</Section>
<style>
  .hero { min-height: 100svh; }   /* never applies */
</style>
```

This bit the build **eight** times:

| Where | Symptom |
|---|---|
| `.hero` min-height | Hero grew past one viewport |
| `.footer` rhythm | Footer used default section padding |
| `.pageintro` header clearance | Headings sat under the fixed header |
| `<Reveal class="…">` | Every spacing rule on a revealed block was dead |
| `.dish:nth-of-type()` | Gallery alternation never applied |
| Form submit `.btn` classes | **Send Message rendered as bare text** |
| `.hero__logo` colour | Wordmark rendered cream instead of gold |
| `.hero__tagline` sizing | Tagline size rule ignored |

**Three valid fixes**, in order of preference:

1. Put the style on an element the component actually renders
2. Give the child a prop (`Section` gained `space` for this reason)
3. `:global(.thing)` — used where a wrapper genuinely must be reached

Scroll-reveal styling was moved to `global.css` keyed on `[data-reveal]` for
exactly this reason: put the attribute on an element you own and your own
layout rules keep working.

---

## 4. Other traps, each found the hard way

- **`img { max-width: 100% }`** in `global.css` silently caps full-bleed images
  at the container width. The hero escapes it because its negative margin is on
  the *figure*; the gallery needed `max-width: none` on the image.
- **Circular sizing.** `height: 100%` + `aspect-ratio` on a grid item in an
  indefinite-height row: the aspect derives height from `max-width`, the row
  grows to fit, and the hero inflates past `100svh`. Bind to `svh` instead.
- **Astro's prefetch defaults to `hover`** — a phone never hovers. `viewport`
  does not rescue it either: on mobile the desktop nav is `display: none` and
  the overlay is `[hidden]`, so an IntersectionObserver never sees a link. Only
  **`load`** works. This was the real cause of "routing feels slow on mobile".
- **`Cache-Control: max-age=0` defeats prefetch entirely** — the prefetched HTML
  cannot be reused, so every tap revalidates over the network. Measured: 366–597 ms
  → 119–329 ms just from changing that one header.
- **Content/Vite caches go stale.** If a content edit or scoped CSS change does
  not show, kill dev and `rm -rf .astro node_modules/.vite`.
- **CI needs `astro sync` before `tsc`.** `.astro/types.d.ts` is gitignored, so a
  clean checkout cannot resolve `astro:content` — passes locally, fails in CI.
- **pdf.js v4 removed its SVG backend.** Hence the hand-written extractor.
- **`role="text"` is a Safari extension, not ARIA.** Astro's a11y audit rejects
  it. Use a visually-hidden string plus `aria-hidden` artwork.
- **`background-clip: text` does not clip to SVG paths.** The "gold as foil"
  gradient silently rendered the wordmark cream. Backed out; solid gold is right.
- **Programmatic `.focus()` does not trigger `:focus-visible`** in Chrome, so a
  scripted focus audit reports false negatives. `scripts/kbd.mjs` sends real Tab
  keypresses.
- **Careful with regex CSS surgery.** `\.hero__word[^{]*\{` also matched
  `.hero__wordmark { … }` and deleted it.

---

## 5. Brand system

Full specification lives in build-context §5.2, §6.2, §6.3 and §6.3a. Summary:

**Palette** — no emerald anywhere.

```
--ink #0C0C0B   --cream #FBF8F3   --ink-raised #161614   --cream-sunk #F2EDE4
--gold #C29B4E  --gold-light #E6C161  --gold-deep #7F6127
--maroon #6D0000  --green #009548  --red #DE2128
```

**Hard contrast rules, enforced by the room system:**

- gold / gold-light — **INK ONLY** (2.45 and 1.63 on cream: both fail)
- maroon — **CREAM ONLY** (1.54 on ink: fails)
- `--gold-deep` is David's own "alternative where applicable" light-background gold

Each room publishes `--room-accent`, `--room-bright`, `--room-emphasis`,
`--room-rule`, `--room-line`, `--room-focus`. A component asks for a *role*, so
it cannot break the rule by accident. `scripts/contrast.mjs` checks every page
for both prohibitions plus AA.

**Devices, all lifted from the cover and media kit — do not invent more:**
tagline treatment, page-foot ornament, double hairline rule, grain on ink,
maroon oval.

**Typography.** Josefin Sans is the display face; **Inter carries body copy**.
That split is David's own — media kit p.5 sets the heading in Josefin and the
paragraphs in a neutral humanist sans. Josefin has a small x-height and
geometric rounds; at 16px over six lines it reads letter-by-letter.

---

## 6. Font licensing — read before touching fonts

Verified from the font binaries, not taken on trust:

| Font | fsType | Verdict |
|---|---|---|
| Balkist-Bold | **4 — Preview & Print only** | **Never ship** |
| Bandung-Signature(-Alt) | 8, "All rights reserved", no OFL | **Never ship** |
| JosefinSans | **0**, `scripts.sil.org/OFL` | Safe to serve |

Balkist and Bandung appear on the site **only as outlined vector paths inside
the logo SVGs** — artwork, which the client's desktop licence covers. There is
deliberately **no `@font-face`** for either and no `.otf` in the repo.

**`Logo - Text.pdf` carries both fonts embedded as live text**, so it cannot be
converted to SVG directly. `scripts/wordmark.mjs` generates outlines from the
font files instead, using David's exact measured lockup (below).

**Invariants to re-check after any font work:**

```bash
# must list only Josefin Sans and Inter
grep -A3 '@font-face' src/styles/global.css | grep font-family
# must all be 0
grep -c '<text' src/assets/brand/*.svg public/favicon/favicon.svg
```

**Lockup geometry**, read out of the PDF rather than eyeballed:

```
Island  Balkist  36.31pt  x 210.84  y 465.65
Italy   Balkist  36.31pt  x 457.67  y 465.65
meets   Bandung 118.94pt  x 359.48  y 448.87   ← 3.276x the serif size
```

---

## 7. Deviations from the build context, and why

1. **Meeting line renders per-section, not `position: fixed`.** §6.1's note
   cannot work with §6.4's opaque alternating rooms — a fixed line beneath them
   is painted over, and gold at 0.28 is invisible on cream anyway.
2. **Hero split reordered.** §7.1's 55/45 split with a `--step-5` wordmark
   straddling the centre rule is geometrically impossible; the wordmark takes
   full width and the split happens on the row beneath.
3. **Mobile nav and contact form are not React islands.** §8/§9 specify React;
   §13 caps JS at 40 KB and React alone is 57 KB. Both are ~1–2 KB of vanilla,
   and the form still works without JS because it is a real `<form>`.
4. **Content collections use Astro 5's loader API.** §10.1 was written against
   Astro 4's `type: 'data'`. Schema shape is field-for-field identical.
5. **Dish names use `--step-1`** per §7.1, below §6.3's `--step-3` display floor.
   Specific instruction beat the general rule.
6. **Body face is Inter, not Josefin** — see §5 above.
7. **Gold-as-foil gradient rejected** — `background-clip: text` does not work on
   SVG paths.

---

## 8. Deployment

**Cloudflare Workers with static assets.** `wrangler.jsonc` is committed so the
target is in the repo, not only in the dashboard.

Two things that are easy to break:

- **`public/.assetsignore`** listing `_worker.js` and `_routes.json`. Without it
  wrangler *refuses to deploy*: uploading `dist/_worker.js/` as a public asset
  would expose server code.
- **`session: { driver: 'memory' }`** in `astro.config.mjs`. The adapter
  otherwise auto-enables KV sessions and expects a `SESSION` binding that does
  not exist. Nothing uses sessions.

CI (`.github/workflows/ci.yml`): install → `astro sync` → typecheck → build →
serve + audit → **`wrangler deploy --dry-run`** → JS budget. The dry-run was
added specifically because `astro build` does not exercise deploy config, which
is how the `_worker.js` failure reached production.

**Contact endpoint** — `src/pages/api/contact.ts`, the only non-prerendered
route. **Fails loud on purpose:** in production, if `contact.formRecipient` or
`RESEND_API_KEY` is missing it returns **503**, and the build prints a warning.
A "success" that sent nothing is worse than an honest failure. Dev logs and
returns success so the form can be demoed.

Secrets: `npx wrangler secret put RESEND_API_KEY` (and `TURNSTILE_SECRET_KEY`).

---

## 9. `resources/` — open licensing decision

`resources/` is the client's read-only reference and is **partly tracked** (the
build context markdown is, and CI reads it — the copy audit compares against
that file rather than a retyped copy, so it must stay).

**Untracked and unpushed** are the brand source files. The repo is **public**:

| File | Consideration |
|---|---|
| `fonts used.zip` | **Contains Balkist and Bandung.** Committing this to a public repo is redistribution of restricted commercial fonts. **Do not commit.** |
| `Logo - Text.pdf`, `Logo.ps` | Carry both fonts embedded as subsets. Normal for a design file, but it is the client's asset — their call. |
| `Logo - Image.pdf`, `Logo (1).ps` | No restricted fonts. Safe. |
| Media kit PDF, `email-2.pdf` | Client material. Fine in a private repo; consider before a public one. |

Recommended: add to `.gitignore` before the next `git add -A`.

```gitignore
resources/fonts used.zip
resources/*.otf
resources/*.ttf
```

---

## 10. Tooling built (`scripts/`)

None of it ships. All of it is re-runnable.

| Script | Does |
|---|---|
| `prepare-photos.mjs` | Strips phone-screenshot chrome from the food photos, grades them, bakes the author photo's EXIF rotation in (sharp strips EXIF, so it would render sideways otherwise) |
| `og.mjs` | OG cards in headless Chrome using the real fonts, palette and outlined wordmark |
| `pdfkit.mjs` | pdf.js harness — `info`, `text`, `runs` (exact text placement), `render` |
| `pdf2svg.mjs` | Dependency-free PDF content stream → SVG. **Emits only `<path>`**, so "no text elements" holds by construction |
| `svgslice.mjs` | Slices one instance out of a brand sheet, re-origins it, recolours to `currentColor` |
| `wordmark.mjs` | Outlined wordmark from the font files via opentype.js |
| `shoot.mjs` | CDP screenshots — `--to <selector>`, `--scroll`, `--eval`; hides the dev toolbar and disables smooth scroll (both corrupted earlier captures) |
| `contrast.mjs` | WCAG AA + gold-on-light + maroon-on-dark, on the live DOM |
| `audit.mjs` | Multi-route. Compares copy against the build-context file itself |
| `kbd.mjs` | Real Tab keypresses; focus trap and focus return |
| `formtest.mjs` | Form preselect, validation, a11y wiring, submit, honeypot |
| `navtiming.mjs` | Route-change phases with CPU throttling and RTT emulation |
| `serve-dist.mjs` | Static server with configurable cache headers and gzip — `astro preview` sends `no-cache`, which hides whether caching works |

This machine has **no Ghostscript, poppler, Inkscape or ImageMagick**, which is
why the PDF/SVG tooling was written rather than reached for.

```
npm run photos | npm run og | npm run audit | npm run audit:contrast
```

---

## 11. Measurements

**Lighthouse, mobile, throttled** (against the production build, gzip on):

| | perf | a11y | best-practices | seo |
|---|---|---|---|---|
| `/about`, `/media` | **100** | 100 | 100 | 100 |
| `/contact` | 97 | 100 | 100 | 100 |
| `/cookbook` | 96 | 100 | 100 | 100 |
| `/gallery` | 95 | 100 | 100 | 100 |
| `/` | 92 | 100 | 100 | 100 |

Home is the outlier — the arancini hero is the LCP at ~3.3 s.

- **Page JS: ~7 KB gzipped** against a 40 KB budget
- **Fonts: 396 KB → 250 KB** after Fraunces was removed
- Contrast: all six pages AA, no gold-on-light, no maroon-on-dark
- Keyboard: every tab stop shows a gold ring; nav traps focus and returns it
- Reduced motion: nothing hidden, no animation

Measure like production or the numbers lie — `astro preview` sends `no-cache`
and does not gzip, which cost 10 Lighthouse points of phantom regression once.

---

## 12. Open items

**Decisions waiting on the client / you:**

1. **Meeting line vs. the image mark (§7).** They collide — the line bisects the
   ornament — and the hero reads cleaner without it, because the wordmark's own
   script "meets" already *is* the convergence. Reported with screenshots; **not
   changed unilaterally**, as instructed. Recommendation: drop the line.
2. **Whether the brand source files go in a public repo** (§9 above).

**Unfinished work:**

- §8 polish pass is partial. Double rules, focus rings and the 404 are in.
  **Optical alignment, hanging punctuation, and a full 1440/390 vertical-rhythm
  review of every section are not.**
- Full page-by-page screenshot set at both widths.
- Green/red on the OG card tagline is not rendering despite correct logic and
  palette — one card to re-verify.
- A simplified small-size mark. The current favicon is the full mark at a heavy
  stroke; the fine line work cannot resolve below ~80 px.

**Still pending from the client:** standalone hi-res book cover (current one is
extracted from the media kit PDF at 1819×2355), hi-res food photographs, ISBN,
publication date, purchase URL, contact email, social links, final media kit,
Resend key, Turnstile keys. All `null` in `src/config/site.ts`, all degrading
cleanly — nothing renders as empty, broken or "coming soon".

---

## 13. Conventions worth keeping

- **Every colour and font is a custom property in one file.** No component holds
  a hex value or a font stack.
- **Config drives everything pending.** `src/config/site.ts` is the single swap
  point; every `null` degrades to *nothing*, never to a placeholder.
- **Mobile is the base layout**, `@media (min-width: 900px)` is the enhancement.
- **Approved copy in §4 is final.** The audit compares against the source
  document, so drift fails CI rather than reaching the client.
- Uppercase headings are applied with `text-transform`, so screen readers are
  not handed literal all-caps.
