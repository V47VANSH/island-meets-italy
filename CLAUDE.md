# Island Meets Italy

Marketing site for Chef Kenton Lowrie's culinary brand and his debut cookbook.
Astro 5 (static) + Tailwind v4 tokens, deployed to Cloudflare Workers.

**Client:** Chef Kenton Lowrie · **Designer:** David · **Build:** Vansh Bansal

Long-form history, decisions and deviations live in `SESSION-CONTEXT.md`.
Client requirements, approved copy and page specs live in
`resources/island-meets-italy-BUILD-CONTEXT.md` — that file is the source of
truth and CI reads it, so it must stay in the repo.

## Commands

```bash
npm run dev            # astro dev  (adds a fixed ASTRO-DEV-TOOLBAR — see below)
npm run build          # production build
npm run audit          # copy / a11y / schema audit against the build context
npm run audit:contrast # WCAG AA + the gold-on-light and maroon-on-dark bans
npm run sweep          # horizontal-overflow sweep, 320-2600px x every page
node scripts/serve-dist.mjs 4600 "public, max-age=600"   # serve dist/ like prod
```

`npm run preview` sends `no-cache` and does not gzip — measure against
`serve-dist.mjs` instead or the numbers lie.

**Windows note:** Git Bash mangles a bare `/` argument into a Windows path, so
run the audit scripts from PowerShell:
`node scripts/audit.mjs http://127.0.0.1:4600 / /about ...`

## The trap that has bitten this repo ten times

**Astro scopes a component's CSS to its own template.** A class passed *into* a
child component lands on that child's root element, which carries the
**child's** `data-astro-cid-*`, so the parent's rule never matches. It fails
silently — no error, no warning, the style is simply dead.

```astro
<ChefPortrait class="chef__portrait" />
<style>
  .chef__portrait { width: 26rem; }   /* DEAD. Never applies. */
</style>
```

Fix by reaching it through an element the parent actually renders:

```css
.chef__grid :global(.chef__portrait) { width: 26rem; }
```

`<Image>` from `astro:assets` is the exception — it renders a bare `<img>` that
inherits the *parent's* scope, so classes passed to it work normally.

To find dead rules, load a **production** page (dev-mode CSSOM is not readable)
and test each scoped selector against the DOM. Note that a modern
`CSSStyleRule` also exposes `.cssRules`, so a naive walker that recurses on
that property will skip every style rule.

## Layout system

- **Mobile is the base layout.** `@media (min-width: 900px)` is the enhancement.
- **`--edge-x` is the one content edge.** `.section__inner` and `.header__inner`
  both pad by it, and full-bleed children use it too, so contained and bleed
  sections line up. Do not reintroduce `max-width + auto margins + gutter` —
  that measures from the layout viewport while `--edge-x` measures from
  `100vw`, and the two disagree by half a scrollbar.
- **The meeting line is the column boundary.** `--axis-x` is `50%` on desktop.
  A `1fr 1fr` grid inside `.section__inner` lands exactly on it. Blocks sit
  `clamp(1.75rem, 4vw, 3.5rem)` off the axis — use that exact value so every
  section agrees.
- **A mobile stacking `gap` becomes a column gap on desktop.** Always write
  `gap: <row> 0` or set `column-gap: 0` in the desktop block, or the second
  column is pushed off the axis by the gap's width.
- **Put padding on a wrapper, not on a child component's root.** That root
  sizes its own artwork against its content box, so padding shrinks the
  artwork inside its frame. Use `margin-inline-end` instead.
- Headings may be right-aligned into the axis; **running prose never is.**

## Colour: the room system

Every colour and font is a custom property in `src/styles/tokens.css`. No
component holds a hex value or a font stack.

Each section is a "room" that publishes the only colours its children may use:
`--room-accent`, `--room-bright`, `--room-emphasis`, `--room-rule`,
`--room-line`, `--room-focus`, `--room-text`, `--room-mute`, `--room-bg`.
Ask for a *role*; never reach for `--gold` directly in a component.

Two hard contrast rules the room system encodes so they cannot be broken:

- **gold and gold-light are INK ONLY** (2.45 and 1.63 on cream — both fail)
- **maroon is CREAM ONLY** (1.54 on ink — fails)
- `--gold-deep` is the light-background gold.

**There is no emerald in this brand.** The green is `--green #009548`. If the
client says "emerald", they mean that green.

Red and green never carry meaning alone — always alongside text, position or
shape (as in the tagline device).

`npm run audit:contrast` checks every page for both prohibitions plus AA.

## Config drives everything pending

`src/config/site.ts` is the single swap point. Every value the client has not
supplied is `null` there and nowhere else, and **every null degrades to
nothing** — never to a placeholder, an empty state, or a "coming soon" label.
`PENDING_LABEL` renders `Pending` in the book-info table at the same size, so
the real value lands with no layout shift.

Invalid structured data is worse than none: **omit** a JSON-LD property whose
config value is null rather than emitting an empty string.

## Fonts — read before touching

Verified from the binaries, not taken on trust:

| Font | fsType | Verdict |
|---|---|---|
| Balkist-Bold | 4 — Preview & Print only | **Never ship** |
| Bandung-Signature | 8, all rights reserved | **Never ship** |
| Josefin Sans | 0, OFL | Safe to serve |

Balkist and Bandung appear **only as outlined vector paths inside the logo
SVGs** — artwork, which the client's desktop licence covers. There is
deliberately no `@font-face` for either. Invariants:

```bash
grep -A3 '@font-face' src/styles/global.css | grep font-family   # Josefin + Inter only
grep -c '<text' src/assets/brand/*.svg public/favicon/favicon.svg # must all be 0
```

Josefin is the **display** face; **Inter carries body copy**. That split is
David's own (media kit p.5), not a compromise.

## Verifying visual work

The project ships its own CDP tooling in `scripts/` that spawns Chrome
directly, so it works even when the chrome-devtools MCP server is unavailable:
`shoot.mjs` (screenshots), `contrast.mjs`, `kbd.mjs` (real Tab keypresses),
`formtest.mjs`, `navtiming.mjs`.

When checking layout in a browser:

- **Reveals hide off-screen content.** Remove `js-reveal` from `<html>` and add
  `is-revealed` to `[data-reveal]`, or a full-page screenshot is mostly blank.
- **Full-page screenshots stamp fixed elements once per viewport tile.** In dev
  that paints the `ASTRO-DEV-TOOLBAR` repeatedly down the page as dark bars.
  It is a dev-only artifact, not a site defect — check against `dist/`.
- **Full-page screenshots also break `svh`/`vh` units.** Capturing a full page
  resizes the viewport to the document height, so the hero's `min-height:
  100svh` resolves to the whole document and the hero photograph appears to
  fill thousands of pixels. Always confirm a suspected sizing bug with a
  normal-viewport capture before chasing it.
- **Sweep widths, don't spot-check.** Overflow regressions hide between
  breakpoints. `npm run sweep` (against a `serve-dist.mjs` server) drives an
  offscreen iframe across 320→2600px on every page and asserts nothing has
  `right > clientWidth` or `left < 0`. It skips elements at `left < -1000`,
  because the contact form's honeypot lives at -9999px on purpose.
- **Portrait images:** bound them by *height*, not column width. A 3:4 frame
  driven from a wide column goes taller than the viewport.

## Deployment

Cloudflare **Workers** with static assets, not Pages. Two things that are easy
to break:

- `public/.assetsignore` listing `_worker.js` and `_routes.json`. Without it
  wrangler refuses to deploy.
- `session: { driver: 'memory' }` in `astro.config.mjs`. The adapter otherwise
  expects a `SESSION` KV binding that does not exist.

`@astrojs/cloudflare` is **pinned to 12.6.13** — 13+ needs Astro 6.

`@astrojs/react` is installed but deliberately **not** in the config: its Fast
Refresh wrapper 500s every hoisted `<script>` in dev on this Astro/rolldown
combination, while `astro build` stays green. Nothing is a React island.

The contact endpoint (`src/pages/api/contact.ts`) is the only non-prerendered
route and **fails loud on purpose**: missing `contact.formRecipient` or
`RESEND_API_KEY` returns 503 in production rather than silently accepting an
inquiry. Secrets: `npx wrangler secret put RESEND_API_KEY`.

## Conventions

- Approved copy in build-context §4 is final; the audit compares against that
  file, so drift fails CI rather than reaching the client.
- Uppercase headings via `text-transform`, so screen readers are not handed
  literal all-caps.
- **Never render a telephone number.** Explicit client prohibition.
- Reduced motion is a hard requirement: nothing hidden, no animation.
