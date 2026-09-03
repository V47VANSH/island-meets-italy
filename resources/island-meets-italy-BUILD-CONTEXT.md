# Island Meets Italy — Complete Build Context

> **This file is the single source of truth.** It contains everything needed to build
> the site: client requirements, approved copy, design system, technical architecture,
> and build order. No other file should be required as context.
>
> **Last updated:** 25 Aug 2026
> **Status:** Ready to build. Brand assets (logo, exact colours, typography) pending from client's designer.

---

## 0. How to use this file

- §1–5 are **client-supplied requirements**. Treat as fixed. Do not invent, reword, or "improve" the approved copy in §4 — it is final and client-approved.
- §6–13 are **our technical and design decisions**. Follow them exactly unless something is technically impossible, in which case flag it.
- §14 lists **pending items**. Everything pending must be driven from one config file so it can be swapped in later without touching templates.
- §15 is the **build order**. Work in that sequence.

---

## 1. Project summary

Build the official website for **Island Meets Italy**, the culinary brand of **Chef Kenton Lowrie** — a Toronto-based professional chef with 20+ years of kitchen experience and a background in Culinary Management at Humber College.

The concept: Jamaican flavour meeting Italian technique. The site launches alongside his debut cookbook, *Island Meets Italy — Volume 1: Foundations of Flavor*.

**The site's job.** A first-time visitor should quickly understand who Chef Kenton Lowrie is, what Island Meets Italy represents, what makes the Jamaican-Italian concept distinctive, what the food looks like, what the cookbook is, where to buy it, and how to get in touch.

**Client's stated objective, verbatim:** *"The website should feel like a professional culinary brand with room to grow, not a temporary website created only to sell one cookbook."*

**Quality bar.** This must look like premium studio work. Editorial, confident, restrained. Not a template. The design section (§6) is opinionated on purpose — follow it.

---

## 2. People and project history

| Role | Name | Contact |
|---|---|---|
| Client | Chef Kenton Lowrie | kentonlowrie9@gmail.com |
| Referrer / collaborator | Rajneesh Goyal | rajneesh6625@gmail.com |
| Developer | Vansh Bansal | v47vansh@gmail.com |
| Brand designer (client side) | David | via Kenton — supplying logo, colour codes, typography |

**History**

1. **21 Aug 2026** — Kenton sends an initial brief to Raj: brand site plus a Shop selling the cookbook and an Island Meets Italy Dry Jerk Rub.
2. **21 Aug 2026** — Kenton sends a second, detailed design & layout brief. Shop is absent; cookbook purchase button is listed as "once available." Also asks what platform and hosting will be used, and confirms he owns `islandmeetsitaly.com` and `.ca` via GoDaddy.
3. **22 Aug 2026** — Vansh replies: Astro + Cloudflare Pages, ownership arrangement, asset list, and three clarifying questions (shop scope, cookbook status, photography rights).
4. **25 Aug 2026** — Kenton sends the formal **Website Build Guidelines** document plus four approved food photographs. All page copy is written and approved. The shop question is answered definitively (see §3). Brand assets still pending from David.

**Scope discipline.** This is a fixed-price freelance build. The guidelines document is the agreed scope. Anything beyond it — an active store, checkout, shipping, product pages, restaurant functionality, photography, copywriting — is a separate engagement. Build the architecture to accommodate them; do not build them.

---

## 3. Scope

### In scope

- Six content pages plus a persistent purchase call-to-action: **Home, About, Cookbook, Gallery, Media, Contact**, and **Buy the Book**
- Contact form with inquiry-type routing
- Media kit PDF download (placeholder file now, final swapped later)
- Mobile-first responsive design, with mobile layouts designed intentionally rather than scaled down
- Accessibility: WCAG 2.1 AA, descriptive alt text
- SEO: titles, metadata, sitemap, structured data
- Both domains connected, `.ca` → `.com` redirect
- Architecture prepared for a future Products section and a future restaurant section

### Explicitly out of scope

Client's own words, §11 of the guidelines: *"An active e-commerce store is not required for the initial launch. Do not display an empty Shop in the public navigation."*

- E-commerce, checkout, payments, shipping, tax
- Product pages for the Dry Jerk Rub
- Restaurant functionality
- Photography, videography
- Copywriting (all copy is supplied and approved)
- Ongoing maintenance (quoted separately if wanted)

### Architectural requirements for the future

Design so these can be added later **without rebuilding**:

- A Products / Shop section supporting product photography, description, package size, ingredients, allergen information, price, shipping and fulfilment info, and purchase functionality. First planned product: **Island Meets Italy Dry Jerk Rub**.
- Additional cookbook volumes.
- A dedicated restaurant section.

Practically this means: content collections rather than hardcoded pages, a route structure that can absorb `/products/[slug]`, and navigation driven from config rather than hardcoded markup.

---

## 4. Approved copy

**This copy is final and client-approved. Reproduce it exactly. Do not rewrite, expand, trim, or "punch up."** Button labels are also final.

### 4.1 Global

- **Brand name:** Island Meets Italy
- **Tagline:** Where Island Soul Meets Italian Heart
- **Chef title line:** Chef Kenton Lowrie — Professional Chef • Author • Founder
- **Copyright:** © 2026 Island Meets Italy Inc. All Rights Reserved.

**Navigation:** `HOME | ABOUT | COOKBOOK | GALLERY | MEDIA | CONTACT | BUY THE BOOK`

`BUY THE BOOK` is live from day one. Until the real purchase URL exists it points at `/cookbook`. When the URL arrives, only the config value changes.

### 4.2 Home page

**Hero**

> ISLAND MEETS ITALY
>
> Where Island Soul Meets Italian Heart
>
> Jamaican soul. Italian tradition. One culinary journey.
>
> Created by Chef Kenton Lowrie, Island Meets Italy brings together the bold flavours of Jamaica and the timeless traditions of Italian cuisine through food built on strong foundations, quality ingredients and genuine passion.

Buttons: `EXPLORE THE COOKBOOK` | `MEET CHEF KENTON`

**Brand introduction**

> Two Cultures. One Table.
>
> Island Meets Italy was born from a simple idea: two culinary traditions separated by geography, yet connected by family, passion and the joy of sharing great food.
>
> The food respects what makes Jamaican and Italian cooking distinctive while finding natural places where the two can meet. Familiar flavours become something new without losing the character of either tradition.

Button: `DISCOVER ISLAND MEETS ITALY`

**Cookbook feature**

> THE DEBUT COOKBOOK
>
> Island Meets Italy — Volume 1: Foundations of Flavor
>
> The first cookbook from Chef Kenton Lowrie introduces home cooks to the foundations behind his Jamaican-Italian cooking, from signature sauces and seasonings to pasta, seafood, risotto, mains, cocktails and desserts.
>
> With clear instructions, chef's notes, serving suggestions and professional techniques, Foundations of Flavor is designed to help home cooks build confidence and create restaurant-quality food in their own kitchens.

Buttons: `DISCOVER THE BOOK` | `BUY THE BOOK`

**Chef introduction**

> MEET CHEF KENTON LOWRIE
>
> Professional Chef • Author • Founder
>
> With more than 20 years of professional kitchen experience and a background in Culinary Management at Humber College, Chef Kenton Lowrie created Island Meets Italy as an expression of his culinary experience, Jamaican heritage and passion for Italian cuisine.
>
> Great food begins with strong foundations, quality ingredients and genuine passion.

Button: `MEET CHEF KENTON`

**Food feature**

> FROM THE ISLAND MEETS ITALY KITCHEN
>
> Whole Branzino — Brown Stew Reduction, Coconut-Thyme Rice & Pickled Vegetables
>
> Mango Caprese
>
> Oxtail Arancini
>
> Lime & Coconut Panna Cotta — Caramelized Pineapple & Toasted Coconut

Client instruction: *"Keep supporting text minimal and allow the photography to carry this section."*

**Media feature**

> MEDIA & PRESS
>
> For interviews, media appearances, speaking engagements, partnerships and additional information about Chef Kenton Lowrie and Island Meets Italy.

Buttons: `VIEW MEDIA KIT` | `MEDIA INQUIRIES`

### 4.3 About page

**A Career Built in the Kitchen**

> Chef Kenton Lowrie is a professional chef, author and founder of Island Meets Italy, a culinary brand bringing together the vibrant flavours of Jamaica and the timeless traditions of Italian cuisine.
>
> With more than 20 years of experience in professional kitchens, Kenton has built his career through hands-on cooking, recipe development, menu creation, leadership and a commitment to consistency. His professional experience was further strengthened through Culinary Management studies at Humber College.

**The Story Behind Island Meets Italy**

> Island Meets Italy grew from Kenton's own culinary identity. His Jamaican heritage gave him an appreciation for bold seasoning, layered flavour, warmth and the importance of food in bringing people together. His professional culinary journey developed alongside a deep appreciation for Italian cuisine — its techniques, ingredients, traditions and respect for simplicity.
>
> Rather than forcing two cuisines together, Kenton's approach is to understand what makes each one distinctive and find the places where they naturally complement one another. The result is food that can feel familiar and unexpected at the same time: island soul meeting Italian heart.

**The Philosophy**

> For Kenton, exceptional cooking begins with strong foundations: understanding technique, respecting ingredients, building flavour properly, being consistent, and taking pride in what leaves the kitchen.
>
> That philosophy became the foundation for Island Meets Italy and Volume 1 — Foundations of Flavor.

**More Than a Cookbook**

> Island Meets Italy begins with publishing, but the vision extends beyond the first cookbook. Future cookbook volumes, premium food products and ultimately an Island Meets Italy restaurant form part of the larger culinary vision.

Button: `DISCOVER THE COOKBOOK`

### 4.4 Cookbook page

> ISLAND MEETS ITALY
>
> Volume 1 — Foundations of Flavor
>
> Where Island Soul Meets Italian Heart
>
> By Chef Kenton Lowrie
>
> Island Meets Italy: Volume 1 — Foundations of Flavor is the debut cookbook from Chef Kenton Lowrie and the first publication in the Island Meets Italy series. Drawing on more than 20 years of professional culinary experience, the book explores the meeting of Jamaican and Italian cuisine through recipes that respect tradition while creating something distinctive.

**Build the Foundation. Then Build the Dish.**

> Great cooking begins with understanding the fundamentals.
>
> Readers begin with sauces, seasonings and foundational preparations before moving into appetizers, fresh pasta, seafood, risotto, main courses, sides, cocktails and desserts. Recipes include clear instructions, professional chef's notes, serving suggestions, pairing recommendations and storage guidance.

**Created for the Home Kitchen**

> You don't need to be a professional chef to cook great food. Foundations of Flavor translates professional techniques into approachable instructions while respecting the craft behind them.

**Book information**

| Field | Value |
|---|---|
| Title | Island Meets Italy |
| Volume | Volume 1 — Foundations of Flavor |
| Author | Chef Kenton Lowrie |
| Publisher | Island Meets Italy Inc. Publishing |
| Format | Paperback |
| Pages | 87 |
| Language | English |
| Price | CAD $29.99 |
| ISBN | *Pending* |
| Publication Date | *Pending* |

Display the official high-resolution book cover prominently. Button: `BUY THE BOOK`.

### 4.5 Gallery page

> FROM THE ISLAND MEETS ITALY KITCHEN
>
> Jamaican soul. Italian tradition. Food by Chef Kenton Lowrie.

Four dishes only (see §5.2). Client grants creative freedom over layout, crop and responsive presentation. Gallery expands as more official photography arrives.

### 4.6 Media page

> Chef Kenton Lowrie — Professional Chef • Author • Founder of Island Meets Italy
>
> Chef Kenton is available for interviews, culinary features, television and radio appearances, podcasts, speaking opportunities and discussions surrounding food, publishing and entrepreneurship.
>
> Topics can include the inspiration behind Island Meets Italy, Jamaican-Italian culinary fusion, building flavour through strong foundations, recipe development, professional kitchen leadership, cookbook publishing, entrepreneurship and the future of the Island Meets Italy brand.

Buttons: `DOWNLOAD AUTHOR & BOOK MEDIA KIT` | `MEDIA INQUIRIES`

Build the download now with the proof PDF; final version replaces it later.

### 4.7 Contact page

> GET IN TOUCH
>
> For general inquiries, media opportunities, partnerships, speaking engagements and Island Meets Italy business inquiries.

Form fields: **Name**, **Email**, **Inquiry Type**, **Message**

Inquiry types: `General Inquiry` | `Media & Press` | `Partnerships` | `Speaking / Appearances` | `Business Inquiry`

**Hard rule: never display a personal telephone number.** Official public email and social links only, once supplied.

### 4.8 Footer

- Island Meets Italy logo
- ISLAND MEETS ITALY
- Where Island Soul Meets Italian Heart
- Chef Kenton Lowrie — Professional Chef • Author • Founder
- Social links
- Links: Contact · Media · Cookbook
- © 2026 Island Meets Italy Inc. All Rights Reserved.

---

## 5. Assets

### 5.1 Received

- Four approved food photographs (high-resolution versions being sent separately)
- All page copy (§4)
- Book information, except ISBN and publication date

### 5.2 Approved photography

**Only these images may be used. No AI-generated or artificially recreated food
imagery — this is an explicit client prohibition.**

| # | Dish | Plate | Placement |
|---|---|---|---|
| 1 | Oxtail Arancini | **Dark** slate, marinara ramekin | **Hero.** The cut-open arancino shows Jamaican oxtail inside a Sicilian rice ball — the fusion is visible rather than asserted |
| 2 | Whole Branzino | **White** rectangular plate | Home food feature (cream). The signature dish; largest in the gallery |
| 3 | Lime & Coconut Panna Cotta | **Dark** slate, mint, two coulis dots | Home cookbook feature (ink) |
| 4 | Mango Caprese | **White** plate | About page accent (cream), gallery |

Plus the **approved author photograph** (delivered 29 Aug 2026): a straight-on
studio headshot — black chef's coat, gold chain, cream curtain backdrop. It is
the only portrait available; there is no wide or environmental crop, so no
section is designed around one. Used three times, in two treatments:

- **cream rooms** — the curtain is close to `--cream`, so a soft all-round mask
  dissolves the frame entirely and the portrait reads as printed onto the page
- **ink rooms** — the black coat already matches `--ink`, so the mask leans on
  the bottom: shoulders and coat fall away, face and chain hold the frame

**Constraints.**

1. **The design is typography-led, not photography-led.** Photographs appear at
   a few large, deliberate moments. Filler images do not exist.
2. **Plate colour drives section background.** Dark-plate dishes sit in ink
   rooms, white-plate dishes in cream rooms. `plateTone` in the content
   collection encodes this, so a component picks the right room automatically.
3. **No food photograph appears more than twice, and never with the same crop.**
   The homepage uses a 4:5 box throughout; the gallery shows the native 3:4
   uncropped; the About accent is a 21:9 detail band.

**Source quality.** The four food photographs were delivered as Android
screenshots (1080x2340) of a gallery viewer, containing the real image at
1080x1440 starting at y=450. `scripts/prepare-photos.mjs` strips that chrome and
applies a light grade. **Hi-res originals are still outstanding.** The author
photograph is a genuine 4000x3000 original with EXIF orientation 6; the rotation
is baked in during prep because sharp strips EXIF.

**Orientation.** None of the food photographs are landscape. Do not build a
full-bleed wide hero from them.

### 5.3 Expected asset package structure

Client will deliver in this structure:

```
01 — BRAND          logo, vector/SVG logo, colour codes, typography, brand specs
02 — COOKBOOK       hi-res cover, book info, ISBN, pub date, purchase link
03 — CHEF KENTON    approved hi-res author photograph, About copy
04 — FOOD PHOTOS    the four approved originals only
05 — MEDIA          Author & Book Media Kit PDF
06 — WEBSITE COPY   guidelines + approved page copy
07 — CONTACT/SOCIAL official public email, official social links
```

---

## 6. Design direction

The palette is mandated by the client (black, gold, emerald green, cream accents) and is not open for reinterpretation. Everything below is how we spend the axes the brief leaves free.

### 6.1 The signature: the meeting line

The brand's entire thesis is two things converging — *Island Meets Italy*, *Two Cultures. One Table.* The site should say that structurally, not just in words.

**A single gold hairline runs vertically down the page.** On desktop it sits on the centre axis; on mobile it moves to the left margin and doubles as a scroll spine. Sections alternate which side they enter from, so the eye crosses the line repeatedly as it descends. The hero places `ISLAND` and `ITALY` on opposite sides of it with `MEETS` straddling the rule.

This is the one memorable element. Everything else stays quiet and disciplined. Do not add a second signature.

Implementation: a `1px` fixed-position pseudo-element at `--gold` with low opacity (`0.28`), sitting behind content, with `z-index` below all sections. It should not break on scroll or interfere with pointer events.

### 6.2 Colour tokens

**Official brand specification, supplied by the client's designer (David).**
These replace the placeholders used in earlier phases. **There is no emerald in
this brand.**

The system is the two flags — Jamaica's green and gold, Italy's green and red —
held together by gold.

```css
:root {
  /* Surfaces. No black or off-white was specified; the cover is
     effectively black with a fine grain. */
  --ink:        #0C0C0B;
  --ink-raised: #161614;
  --cream:      #FBF8F3;
  --cream-sunk: #F2EDE4;

  /* Brand */
  --gold:       #C29B4E;  /* primary. INK ONLY */
  --gold-light: #E6C161;  /* INK ONLY */
  --gold-deep:  #7F6127;  /* David's "alternative where applicable" — the
                             light-background gold. CREAM ONLY */
  --maroon:     #6D0000;  /* CREAM ONLY */
  --green:      #009548;
  --red:        #DE2128;
}
```

**Measured contrast. Enforce, do not guess.**

| | on `--ink` | on `--cream` |
|---|---|---|
| `--gold` #C29B4E | 7.54 AA | 2.45 **fails** |
| `--gold-light` #E6C161 | 11.34 AA | 1.63 **fails** |
| `--gold-deep` #7F6127 | 3.39 large only | 5.44 AA |
| `--maroon` #6D0000 | 1.54 **fails** | 12.01 AA |
| `--green` #009548 | 5.03 AA | 3.68 large only |
| `--red` #DE2128 | 4.06 large only | 4.55 AA |

- **Ink rooms:** gold and light gold for accents, green as second accent.
  Never maroon.
- **Cream rooms:** gold-deep for accents, maroon for emphasis text. Never gold
  or light gold.

Each room publishes only the colours its children may use — `--room-accent`,
`--room-bright`, `--room-emphasis` — so a component asks for a role and cannot
break the rule by accident.

**Red and green never carry meaning alone.** Roughly 8% of men cannot reliably
separate them; they always appear alongside text, position or shape.

`scripts/contrast.mjs` checks every page for both prohibitions and for AA.

### 6.3 Typography

**Josefin Sans is the brand face** — and the only supplied font that may be
served as a webfont.

| Role | Face | Why |
|---|---|---|
| Display | **Josefin Sans** (300-700, variable) | The official brand face. Set light and generously tracked, as David sets it throughout the media kit |
| Body | **Inter** (variable) | Neutral, large x-height, OFL. See below |
| Utility | Josefin Sans, uppercase, `0.16em` tracking | Eyebrows, labels, buttons, nav |

**Font licensing — no exceptions.**

Only Josefin Sans may be served. SIL OFL, fsType 0, verified from the font
binary rather than taken on trust.

**Balkist Bold and Bandung Signature must NOT enter the build.** Both are
commercial faces from independent designers (Mulkan Nazir / Great Studio;
arendxstudio) with no embedded licence — Balkist is fsType 4, *Preview & Print
only*. The client's desktop licence covers making artwork, not serving fonts.
They appear on the site **only as outlined vector paths inside the logo SVGs**,
which is artwork. There is deliberately no `@font-face` for either, and no
`.otf` is copied into the repository.

**Why the body face is not Josefin.** This is David's own structure, not a
compromise: page 5 of the media kit sets the heading in Josefin and the body
paragraphs in a neutral humanist sans with a much larger x-height. Josefin has a
small x-height and geometric, near-identical round letterforms; at 16px over a
six-line paragraph it is read letter by letter rather than by word shape.
Setting long copy in it would misread the system rather than honour it.

**Rules**

- Display face for headings, labels and the wordmark; Inter for running prose
- Never synthesise bold on Josefin — only real weights from the variable font
- Body copy: `1.75` line-height, `65ch` max measure
- `text-wrap: balance` on headings, `pretty` on body
- Book info table uses `font-variant-numeric: tabular-nums`
- The client's uppercase headings and button labels stay uppercase, applied with
  `text-transform` so screen readers are not given literal all-caps

### 6.3a Brand devices

Lifted from the cookbook cover and the media kit. Do not invent beyond these.

- **The tagline treatment.** *Where **Island** Soul* — script *meets* —
  ***Italian** Heart*: "Island" in green, "Italian" in red, "meets" as an
  outlined SVG fragment from the logo, the rest in gold. David's own device; it
  encodes the concept in one line. Reproduced wherever the tagline appears.
  Colour is reinforcement only — the words carry the meaning, and the accessible
  name is the plain sentence.
- **The ornament.** The grape-and-palm mark appears at the foot of every media
  kit page. Used the same way: a quiet section divider or page-foot device, gold
  on ink and gold-deep on cream, at a restrained size.
- **The double hairline rule.** The cover sets thin double rules above and below
  "JAMAICAN-ITALIAN FUSION RECIPES". Adopted as the section divider, replacing
  generic single rules.
- **The grain.** The cover's black is textured rather than flat. A very
  low-opacity grain on ink sections ties the site to the printed book. If it is
  visible as an effect it is too strong.
- **The oval.** The cover places the mark on a maroon oval — available as a
  containing shape on cream.

### 6.4 Layout

**Dark-dominant with light rooms.** The site's base is `--ink`. Two or three sections switch to `--cream` — these are the "light rooms," and they exist to hold the white-plate photography and to give the page rhythm.

Suggested room sequence on Home:

```
INK    Hero (split, panna cotta)
INK    Brand introduction — type only, wide margins
CREAM  Food feature (branzino, large)
INK    Cookbook feature (arancini)
CREAM  Chef introduction (author photo)
INK    Media feature — type only
INK    Footer
```

**Grid.** 12 columns, `clamp(1.5rem, 5vw, 6rem)` page gutters, `1400px` max content width. Sections alternate content alignment across the centre rule — never centre everything. Asymmetry is the point.

**Vertical rhythm.** Section padding `clamp(6rem, 14vh, 11rem)` top and bottom. Be generous. The client asked for space three separate times; cramped sections will read as cheap regardless of how good the type is.

**Mobile is designed, not scaled.** Client requirement, §14 of the guidelines. Specifically:

- The centre rule moves to the left margin and becomes a scroll spine
- The hero stacks: image top (portrait, ~55vh), type below — not a squeezed two-column
- Section padding drops to `clamp(4rem, 10vh, 6rem)`
- Nav collapses to a full-screen overlay, `BUY THE BOOK` stays visible in the header bar
- Gallery becomes a single-column vertical scroll, full-bleed, one dish per viewport

### 6.5 Navigation

Seven items is heavy. Handle it as **six links plus one button**:

- `HOME ABOUT COOKBOOK GALLERY MEDIA CONTACT` — utility treatment, `--text-on-dark-mute`, gold underline on hover/focus
- `BUY THE BOOK` — a distinct bordered button in `--gold`, visually separate from the link set

Header is transparent over the hero, then becomes a solid `--ink` bar with a hairline bottom rule after ~80px of scroll. On cream sections it inverts to `--cream` with dark text.

### 6.6 Motion

One orchestrated moment, then restraint. Excess animation is what makes a site read as generated rather than designed.

**Hero load sequence** (the only choreographed moment):
1. Gold centre rule draws downward — `scaleY(0 → 1)`, `900ms`, `cubic-bezier(0.16, 1, 0.3, 1)`
2. `ISLAND` slides in from the left, `ITALY` from the right, `MEETS` fades in last — `700ms`, `80ms` stagger
3. Image reveals via `clip-path` wipe — `900ms`, starting at `+200ms`
4. Tagline and buttons fade up — `+400ms`

**Everywhere else:** section reveal on scroll — `opacity 0 → 1`, `translateY(12px → 0)`, `700ms`, `cubic-bezier(0.16, 1, 0.3, 1)`, `60ms` stagger between children. IntersectionObserver, `rootMargin: '0px 0px -12% 0px'`, fire once.

**Micro-interactions:** links get a gold underline that wipes in from the left, `220ms`. Buttons shift background `180ms`. Gallery images scale `1 → 1.03` on hover, `600ms`. Nothing else.

**Page transitions:** Astro `<ClientRouter />` with a short cross-fade. `transition:persist` on the header so it doesn't flicker between routes.

**`prefers-reduced-motion: reduce` disables all of the above.** Content appears at final state immediately. This is a hard requirement, not a nicety.

### 6.7 What not to do

- No parallax on the food photography — it looks cheap and fights the crops
- No gradient overlays or scrims that aren't solving a legibility problem
- No card grids with rounded corners and drop shadows
- No stock icons anywhere
- No counters, no "trusted by," no testimonial carousels
- No centre-aligned everything
- No second signature element competing with the meeting line

---

## 7. Page specifications

### 7.1 Home — `/`

**Hero** (ink, full viewport minus header)

Split layout. Left column ~55%: the wordmark treatment across the centre rule, then tagline, then supporting paragraph, then buttons. Right column ~45%: the panna cotta photograph, portrait, full-bleed to the right edge, `clip-path` reveal on load.

Wordmark treatment: `ISLAND` / `MEETS` / `ITALY` stacked, display face at `--step-5`, `ISLAND` right-aligned to the rule, `ITALY` left-aligned from it, `MEETS` in `--gold` at a smaller size straddling the rule. This is the thesis and the signature working together.

Below: `Where Island Soul Meets Italian Heart` (`--step-2`, display, `--text-on-dark-mute`), then `Jamaican soul. Italian tradition. One culinary journey.` as a utility-treated line in `--gold`, then the paragraph at `--step-0`, then two buttons — `EXPLORE THE COOKBOOK` (filled gold) and `MEET CHEF KENTON` (outlined).

**Brand introduction** (ink, type only)

`Two Cultures. One Table.` at `--step-4`, offset left of the rule. Two paragraphs offset right of it, `65ch`. Button `DISCOVER ISLAND MEETS ITALY` outlined gold. No image — this section earns its keep by being the breath between two photographic moments.

**Food feature** (cream)

Eyebrow `FROM THE ISLAND MEETS ITALY KITCHEN` in `--gold-deep`. The branzino at large scale — at least 60% of viewport width on desktop. The four dish names set as a typographic list beside or below it, each in display face at `--step-1`, separated by hairline rules in `--rule-light`. Minimal supporting text, per client instruction. Dish names link to the gallery.

**Cookbook feature** (ink)

Eyebrow `THE DEBUT COOKBOOK`. Title `Island Meets Italy — Volume 1: Foundations of Flavor` at `--step-3`. Book cover image on one side, the two approved paragraphs on the other. The arancini photograph as a smaller secondary image, offset and overlapping the section edge. Buttons `DISCOVER THE BOOK` (filled) and `BUY THE BOOK` (outlined).

**Chef introduction** (cream)

Author photo, portrait, roughly one-third width. `MEET CHEF KENTON LOWRIE` at `--step-3`. `Professional Chef • Author • Founder` in utility treatment, `--gold-deep`. The approved paragraph, then the philosophy line — pull that one out and set it larger, display face, in `--emerald`, as a quiet pull quote. Button `MEET CHEF KENTON`.

**Media feature** (ink, type only)

`MEDIA & PRESS` at `--step-3`. Approved paragraph. Buttons `VIEW MEDIA KIT` and `MEDIA INQUIRIES`.

### 7.2 About — `/about`

Four sections, no images except the author photo at the top:

1. **A Career Built in the Kitchen** — author photo, two paragraphs
2. **The Story Behind Island Meets Italy** — two paragraphs, offset across the rule
3. **The Philosophy** — set larger, in `--emerald` on cream. This is the emotional centre of the page; give it space
4. **More Than a Cookbook** — paragraph plus `DISCOVER THE COOKBOOK`

Mango Caprese may appear once as a light-room accent between sections 2 and 3.

### 7.3 Cookbook — `/cookbook`

- Title block: `ISLAND MEETS ITALY` / `Volume 1 — Foundations of Flavor` / `Where Island Soul Meets Italian Heart` / `By Chef Kenton Lowrie`
- Hi-res book cover, prominent, on ink with a soft gold edge glow — not a drop shadow
- Intro paragraph
- **Build the Foundation. Then Build the Dish.** — heading plus two paragraphs
- **Created for the Home Kitchen** — heading plus paragraph
- **Book information** — a two-column definition list on cream, hairline rules between rows, tabular numerals. ISBN and Publication Date render as `Pending` from config; when values arrive they display normally with no layout shift
- Sticky `BUY THE BOOK` button on mobile, pinned to the bottom of the viewport on this page only

### 7.4 Gallery — `/gallery`

Heading `FROM THE ISLAND MEETS ITALY KITCHEN`, subline `Jamaican soul. Italian tradition. Food by Chef Kenton Lowrie.`

Four dishes. Desktop: an asymmetric editorial grid — not four equal tiles. Vary scale deliberately; the branzino is the signature dish and should be largest. Each image captioned with the full dish name in display face, plus a hairline rule.

Mobile: one dish per viewport, full-bleed, name overlaid or directly beneath.

Lightbox optional. If built, keep it minimal — dark backdrop, no chrome, Escape and arrow-key support, focus trap, focus returned on close.

Driven from a content collection so adding a fifth dish is a data change, not a template change.

### 7.5 Media — `/media`

- `Chef Kenton Lowrie — Professional Chef • Author • Founder of Island Meets Italy`
- Author photo
- Availability paragraph
- Topics paragraph — consider setting the topic list as a typographic list rather than prose, if it reads better; the copy itself stays unchanged
- Buttons: `DOWNLOAD AUTHOR & BOOK MEDIA KIT` (serves the PDF from config path) and `MEDIA INQUIRIES` (links to `/contact?type=media`, pre-selecting the inquiry type)
- Press section: build the component, render nothing when the collection is empty. Do not show an empty-state message on a public page

### 7.6 Contact — `/contact`

`GET IN TOUCH` plus the approved intro. Form: Name, Email, Inquiry Type (select, five approved options), Message.

- Reads `?type=` from the URL to preselect
- Client-side validation with inline messages beneath each field, `aria-describedby` wired
- Errors state what happened and how to fix it, in the interface's voice: "Enter an email address so Kenton can reply." Not "Invalid input."
- Success replaces the form in place with a confirmation; do not navigate away
- Cloudflare Turnstile for spam
- Honeypot field as a second layer
- Official contact email and social links render from config; render nothing when values are empty
- **Never render a telephone number.** Client's explicit instruction

---

## 8. Technical stack

| Layer | Choice | Notes |
|---|---|---|
| Framework | **Astro 5** | Static output. Zero JS by default |
| Styling | **Tailwind CSS v4** via `@tailwindcss/vite` | All tokens declared in `@theme`. Bespoke CSS for the signature elements |
| Images | **`astro:assets`** (sharp) | Build-time AVIF + WebP, responsive `srcset` |
| Islands | React, only where needed | Gallery lightbox, contact form, mobile nav |
| Motion | CSS + IntersectionObserver | No GSAP. Not worth the weight here |
| Transitions | Astro `<ClientRouter />` | `transition:persist` on header |
| Fonts | Self-hosted `.woff2`, variable | `font-display: swap`, preload the display face |
| Host | **Cloudflare Workers** (static assets) | Free tier permits commercial use. Deploy target is committed in `wrangler.jsonc`, not left in the dashboard |
| Forms | Astro endpoint (`prerender = false`) on Workers → **Resend** REST API via `fetch`, no SDK | Turnstile for spam |
| DNS | Cloudflare | `.ca` → `.com` via Redirect Rule |
| Analytics | Cloudflare Web Analytics | Cookieless — no consent banner needed |
| Sitemap | `@astrojs/sitemap` | |

**Workers, not Pages.** The project deploys to Cloudflare Workers with static
assets. The six content pages are prerendered and served as assets; only
`/api/contact` runs on demand, via `export const prerender = false`. A Pages
Function would be inert here, so the contact endpoint is an Astro endpoint
under `@astrojs/cloudflare` (pinned to the 12.x line — 13+ requires Astro 6,
14+ requires Astro 7, and this project is fixed on Astro 5).

**Not Vercel.** Vercel's Hobby tier prohibits commercial use; this is a commercial site and would require Pro. Cloudflare's free tier permits it.

**Ongoing cost to client: $0/month** beyond existing GoDaddy domain renewals.

### 8.1 Dependencies

```
astro                    ^5
@astrojs/react
@astrojs/sitemap
@astrojs/cloudflare      ~12.6    (adapter; Astro 5 line)
@tailwindcss/vite
tailwindcss              ^4
sharp
```

Add nothing else without a concrete reason. Every dependency is a maintenance liability on a site that has to survive unattended.

---

## 9. Repository structure

```
island-meets-italy/
├── src/
│   ├── config/
│   │   └── site.ts              ← ALL pending values live here. Single swap point
│   ├── content/
│   │   ├── config.ts            ← Zod schemas
│   │   ├── dishes/              ← 4 markdown files
│   │   └── press/               ← empty; ready for entries
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Header.astro
│   │   │   ├── Footer.astro
│   │   │   ├── MeetingLine.astro     ← the signature
│   │   │   └── Section.astro         ← handles ink/cream room switching
│   │   ├── home/
│   │   │   ├── Hero.astro
│   │   │   ├── BrandIntro.astro
│   │   │   ├── FoodFeature.astro
│   │   │   ├── CookbookFeature.astro
│   │   │   ├── ChefIntro.astro
│   │   │   └── MediaFeature.astro
│   │   ├── ui/
│   │   │   ├── Button.astro
│   │   │   ├── Eyebrow.astro
│   │   │   ├── Rule.astro
│   │   │   └── Reveal.astro          ← IntersectionObserver wrapper
│   │   └── islands/
│   │       ├── ContactForm.tsx
│   │       ├── Lightbox.tsx
│   │       └── MobileNav.tsx
│   ├── layouts/
│   │   └── Base.astro           ← head, meta, schema, ClientRouter
│   ├── pages/
│   │   ├── api/
│   │   │   └── contact.ts       ← the only non-prerendered route
│   │   ├── index.astro
│   │   ├── about.astro
│   │   ├── cookbook.astro
│   │   ├── gallery.astro
│   │   ├── media.astro
│   │   └── contact.astro
│   ├── styles/
│   │   ├── tokens.css           ← every custom property
│   │   └── global.css
│   └── assets/
│       ├── food/                ← the four approved photographs
│       ├── brand/               ← logo (SVG + fallback)
│       └── book/                ← cover, author photo
├── public/
│   ├── media-kit.pdf            ← placeholder until final
│   ├── robots.txt
│   └── favicon/
├── wrangler.jsonc               ← deploy target, committed not dashboard-only
└── astro.config.mjs
```

---

## 10. Configuration — the single swap point

Everything in §14 lives here and nowhere else. When Kenton sends a value, it changes in one place.

```ts
// src/config/site.ts

export const site = {
  name: 'Island Meets Italy',
  tagline: 'Where Island Soul Meets Italian Heart',
  url: 'https://islandmeetsitaly.com',
  legalName: 'Island Meets Italy Inc.',

  chef: {
    name: 'Chef Kenton Lowrie',
    title: 'Professional Chef • Author • Founder',
  },

  book: {
    title: 'Island Meets Italy',
    volume: 'Volume 1 — Foundations of Flavor',
    author: 'Chef Kenton Lowrie',
    publisher: 'Island Meets Italy Inc. Publishing',
    format: 'Paperback',
    pages: 87,
    language: 'English',
    price: 'CAD $29.99',
    priceValue: 29.99,
    currency: 'CAD',
    isbn: null,              // PENDING
    publicationDate: null,   // PENDING
    purchaseUrl: null,       // PENDING — falls back to /cookbook
  },

  contact: {
    email: null,             // PENDING
    // phone: NEVER. Client prohibition.
  },

  social: {
    instagram: null,         // PENDING
    facebook: null,          // PENDING
    linkedin: null,          // PENDING
    tiktok: null,            // PENDING
    youtube: null,           // PENDING
  },

  mediaKit: {
    path: '/media-kit.pdf',
    isFinal: false,          // flip when final PDF arrives
  },

  nav: [
    { label: 'HOME',     href: '/' },
    { label: 'ABOUT',    href: '/about' },
    { label: 'COOKBOOK', href: '/cookbook' },
    { label: 'GALLERY',  href: '/gallery' },
    { label: 'MEDIA',    href: '/media' },
    { label: 'CONTACT',  href: '/contact' },
  ],

  inquiryTypes: [
    'General Inquiry',
    'Media & Press',
    'Partnerships',
    'Speaking / Appearances',
    'Business Inquiry',
  ],
} as const;

/** BUY THE BOOK destination. Points at /cookbook until the live URL exists. */
export const buyUrl = site.book.purchaseUrl ?? '/cookbook';
```

**Null-handling rules.** Any `null` must degrade gracefully:

- `isbn` / `publicationDate` → render the row with the value `Pending`, same layout
- `purchaseUrl` → `BUY THE BOOK` points at `/cookbook`, no visual difference
- `contact.email` → the mailto link is omitted; the form still works
- Social links → render nothing at all, no placeholder icons
- **Never render an empty state, a broken link, or a "coming soon" label on a public page**

### 10.1 Content collection schema

```ts
// src/content/config.ts
import { defineCollection, z } from 'astro:content';

const dishes = defineCollection({
  type: 'data',
  schema: ({ image }) => z.object({
    name: z.string(),
    shortName: z.string(),
    image: image(),
    alt: z.string(),           // descriptive — required by client
    plateTone: z.enum(['dark', 'light']),
    order: z.number(),
    featured: z.boolean().default(false),
  }),
});

const press = defineCollection({
  type: 'data',
  schema: z.object({
    outlet: z.string(),
    title: z.string(),
    url: z.string().url(),
    date: z.coerce.date(),
    type: z.enum(['article', 'podcast', 'tv', 'radio', 'feature']),
  }),
});

export const collections = { dishes, press };
```

`plateTone` is what lets a component pick the right room automatically — it exists because of the asset constraint in §5.2.

---

## 11. Accessibility

Client requirement, guidelines §14. Target **WCAG 2.1 AA**.

- Semantic landmarks: one `<h1>` per page, correct heading order, `<main>`, `<nav>`, `<footer>`
- Descriptive alt text on all four food photographs — the full dish name plus a short visual description, not just the name. Client asked for "accurate descriptive image alt text"
- The logo's alt is `Island Meets Italy`. Decorative marks get `alt=""`
- Visible keyboard focus everywhere — a 2px `--gold` outline with 2px offset. Never `outline: none` without a replacement
- `prefers-reduced-motion: reduce` disables all transitions and reveals
- Form labels are real `<label>` elements, never placeholder-as-label. Errors linked via `aria-describedby`, `aria-invalid` on failure
- Mobile nav overlay traps focus, closes on Escape, returns focus to the trigger
- Lightbox, if built, same treatment
- Touch targets minimum 44×44px
- Contrast enforced per §6.2 — this is where gold-on-cream will try to sneak in. Don't let it
- Test keyboard-only, and with a screen reader on at least Home and Contact

---

## 12. SEO and structured data

**Search identities** (client-specified): Chef Kenton Lowrie · Island Meets Italy · Island Meets Italy — Volume 1: Foundations of Flavor · Jamaican-Italian cuisine / fusion

**Per page:** unique `<title>` (~55 chars), meta description (~150 chars), canonical URL, Open Graph and Twitter card with a per-page image.

**Structured data** (JSON-LD in `Base.astro`):

- `Person` — Kenton, on Home and About. `jobTitle`, `sameAs` from social config once available
- `Book` — on Cookbook. `name`, `author`, `publisher`, `numberOfPages`, `bookFormat: Paperback`, `inLanguage: en`, `isbn` once available, plus `Offer` with price `29.99` `CAD`
- `Organization` — Island Meets Italy Inc., in the footer
- `BreadcrumbList` on interior pages

Omit any property whose config value is `null` rather than emitting an empty string — invalid structured data is worse than none.

**Also:** `sitemap.xml` via `@astrojs/sitemap`, `robots.txt` allowing all, and OG images generated per page.

---

## 13. Performance

The client asked for "fast loading and optimized for high-resolution food photography." Targets:

| Metric | Target |
|---|---|
| Lighthouse Performance | ≥ 95 mobile |
| Lighthouse Accessibility | 100 |
| LCP | < 2.0s on 4G |
| CLS | < 0.05 |
| Total JS | < 40KB gzipped |

**How:**

- `astro:assets` for every image — AVIF with WebP fallback, `srcset` at 400/800/1200/1600/2400
- Hero image `loading="eager"` + `fetchpriority="high"`; everything else lazy
- Explicit `width`/`height` on all images to prevent layout shift
- Preload the display font only; the body font can swap
- Islands hydrate with `client:visible`, never `client:load`, except the mobile nav trigger
- No third-party scripts beyond Cloudflare Analytics and Turnstile

---

## 14. Pending from client

**Delivered.** Official logo (EPS + PDF), exact brand colour codes, official
typography, author photograph, book cover artwork (interim — see below).

Still outstanding:

| Item | Blocks | Notes |
|---|---|---|
| Standalone hi-res book cover | Cookbook page fidelity | Currently extracted from page 2 of the media kit PDF at 1819x2355. That is a page render, not source artwork |
| Hi-res food photographs | Gallery at full-bleed | The four delivered files are screenshots containing a 1080x1440 image |
| ISBN | Book info, `Book` schema | Renders as `Pending` |
| Publication date | Book info, `Book` schema | Renders as `Pending` |
| Live purchase URL | `BUY THE BOOK` destination | Falls back to `/cookbook` |
| Official public contact email | Contact, footer | Nothing renders until supplied |
| Official social links | Footer, contact, `sameAs` | Nothing renders until supplied |
| Final media kit PDF | Media page download | A placeholder ships; `mediaKit.isFinal` stays `false`. The Aug 19 proof is explicitly not final |
| Resend API key + recipient | Contact form delivery | Until both exist the endpoint returns 503 in production rather than accepting an inquiry it cannot deliver |
| Turnstile keys | Spam protection | The widget and verification both no-op until configured |

**Not blocked by any of the above:** routing, content model, copy, layout,
form logic, accessibility, SEO, deployment.

## 15. Build order

**Phase 1 — Foundation (unblocked, start now)**
1. Astro project, Tailwind v4, React integration, sitemap
2. `src/config/site.ts` with all pending values as `null`
3. `tokens.css` with every custom property from §6.2 and §6.3
4. Content collections + the four dish entries (placeholder images)
5. `Base.astro`: head, meta, ClientRouter, JSON-LD scaffolding
6. Header, Footer, MeetingLine, Section, Button, Eyebrow, Reveal

**Phase 2 — Pages with real copy**
7. All six pages built with approved copy from §4, placeholder imagery
8. Contact form + Pages Function + Resend + Turnstile
9. Media kit download with placeholder PDF
10. Mobile layouts designed separately per §6.4

**Phase 3 — Motion and polish**
11. Hero load sequence
12. Scroll reveals, micro-interactions, page transitions
13. `prefers-reduced-motion` pass
14. Keyboard and screen-reader pass

**Phase 4 — Assets in (blocked until David delivers)**
15. Swap brand tokens for official colours and typography
16. Drop in logo, book cover, author photo, hi-res food photography
17. Grade and crop photography per §5.2
18. Write descriptive alt text
19. Regenerate OG images

**Phase 5 — Launch**
20. Cloudflare Pages project, Kenton's account, developer added as collaborator
21. GoDaddy nameservers → Cloudflare (client-led; see §16)
22. `.ca` → `.com` Redirect Rule
23. Cloudflare Web Analytics
24. Lighthouse, keyboard, screen reader, cross-browser
25. Handover doc: how to update copy, add a dish, add press, swap the media kit, change the purchase URL

---

## 16. Domains, hosting and ownership

Client requirement: *"Make sure I retain full ownership/admin access to the website and domains."*

- Both domains stay registered **in Kenton's name at GoDaddy**. Nothing transfers
- Cloudflare account created **under Kenton's email**, developer added as a collaborator
- Repository under Kenton's GitHub, or transferred at handoff
- Nothing is ever registered in the developer's name
- Only the **nameservers** change at GoDaddy — reversible at any time
- `islandmeetsitaly.com` is primary; `islandmeetsitaly.ca` 301-redirects to it via a Cloudflare Redirect Rule. One site, not two
- HTTPS enforced, HSTS on

Nameserver change is offered three ways, in order of preference: (1) Kenton does it himself with supplied values, (2) screen-share walkthrough, (3) direct access. Prefer 1 or 2 — the GoDaddy account holds other domains and payment methods.

---

## 17. Definition of done

- [ ] All six pages live with approved copy reproduced exactly
- [ ] `BUY THE BOOK` present from day one, pointing at `/cookbook`
- [ ] No empty Shop, no "coming soon", no broken links anywhere public
- [ ] Every pending value driven from `site.ts`; all `null` cases degrade cleanly
- [ ] Four food photographs, each used no more than twice, no reused crops
- [ ] Zero AI-generated imagery
- [ ] Mobile layouts intentionally designed, not scaled down
- [ ] Lighthouse ≥ 95 performance, 100 accessibility
- [ ] Keyboard-navigable end to end, visible focus throughout
- [ ] `prefers-reduced-motion` fully respected
- [ ] No telephone number anywhere on the site
- [ ] Contact form tested end-to-end with a real send — a submission arrives in
      the client's inbox. Until `contact.formRecipient` and `RESEND_API_KEY`
      both exist the endpoint returns 503 by design, so this cannot be ticked
      by seeing the success state in development
- [ ] Structured data validates
- [ ] `.ca` redirects to `.com`
- [ ] Kenton owns the Cloudflare account, the repo, and both domains
- [ ] Handover doc written

---

## 18. Open questions

1. **Photography rights** — asked, not yet answered. Confirm Kenton holds usage rights and whether the photographer requires credit. If credit is needed it goes in the footer.
2. **`r98720@gmail.com`** was CC'd on Kenton's last email. Identify before sending anything sensitive.
3. **Author photograph** — listed in the asset package but not yet received. The About, Home and Media layouts all assume one exists.
4. **Press entries** — the collection is empty. Confirm whether any exist for launch.
