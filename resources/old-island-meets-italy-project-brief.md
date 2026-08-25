# Island Meets Italy — Website Project Brief

**Client:** Chef Kenton Lowrie (kentonlowrie9@gmail.com)
**Referred by:** Rajneesh Goyal (rajneesh6625@gmail.com)
**Build:** Vansh Bansal
**Location:** Toronto, ON
**Status:** Intro email drafted, awaiting assets and scope confirmation
**Last updated:** 25 Aug 2026

---

## 1. Project overview

A brand and portfolio website for Chef Kenton Lowrie — professional chef, cookbook author, founder of Island Meets Italy (Jamaican flavour + Italian technique).

The site should function as an extension of the cookbook and media kit. A first-time visitor should immediately understand who Kenton is, what Island Meets Italy represents, and what makes the concept different.

**Tagline:** *Where Island Soul Meets Italian Heart*

---

## 2. Scope

### Pages
`Home | About | Cookbook | Gallery | Media | Contact`

**Home**
- Hero: logo, "ISLAND MEETS ITALY", tagline
- Intro paragraph — culinary vision of Chef Kenton Lowrie
- CTAs: `EXPLORE THE COOKBOOK`, `MEET CHEF KENTON`
- Below fold: short About, featured cookbook, selected photography, brand story, media/press, social links

**About**
- Kenton's story: culinary background, Jamaican heritage, Italian influence, philosophy behind the brand

**Cookbook**
- *Island Meets Italy – A Fusion Journey*
- *Volume 1: Foundations of Flavor*
- Cover art, short description, key book info, selected food photography
- Purchase button/link — **once available**

**Gallery**
- Clean visual gallery, professional food photography, minimal text

**Media**
- Author photo, short bio, cookbook info, media kit download, media inquiries contact
- Press appearances section (to be populated later)

**Contact**
- Form: general / media / business inquiries
- Social links

**Footer**
- Logo, socials, contact email, copyright, islandmeetsitaly.com

### Explicitly out of scope
- E-commerce / checkout / shipping / tax setup
- Photography
- Copywriting from scratch
- Ongoing maintenance (offered separately)

> **Open item:** Kenton's *first* brief (via Raj) included a Shop selling the cookbook and the Island Meets Italy Dry Jerk Rub. His *second, detailed* brief drops it and lists the purchase button as "once available." Confirmation requested in the intro email. **Do not start until this is answered in writing.**

---

## 3. Brand direction

| | |
|---|---|
| **Colours** | Black, gold, emerald green; white/cream accents |
| **Feel** | Clean, elegant, modern. Upscale culinary. Warm and inviting, not corporate |
| **Layout** | Plenty of clean space, no clutter |
| **Imagery** | Food photography as the dominant visual element |
| **Constraint** | **No AI-generated food imagery** (client-stated) |
| **Logo** | Official Island Meets Italy logo used throughout |

**Internal design note (not raised with client yet):** gold on white fails WCAG contrast. Use gold as an accent on dark backgrounds only; body text in black, cream, or emerald. Frame as a design decision if it comes up.

---

## 4. Technical

### Stack
- **Framework:** Astro (static output)
- **Why:** Zero JS by default; `astro:assets` does build-time responsive AVIF/WebP with no config or CDN cost. Photography-first site, so the image pipeline is the real technical requirement. Next.js with `output: 'export'` disables `next/image` optimisation, which would mean hand-rolling a sharp pipeline.
- **Interactivity:** React islands via `client:visible` where needed (gallery lightbox, etc.)
- **Content:** Markdown/JSON content collections in-repo. Optional: Sveltia CMS (~2h) so Kenton can add press links himself.
- **Styling:** Tailwind. Self-hosted fonts (no Google CDN).

### Hosting & infra
- **Host:** Cloudflare Pages — free tier permits commercial use, unlimited bandwidth, free SSL
  - *Not Vercel:* Hobby tier prohibits commercial use; Pro is ~$20 USD/mo
- **DNS:** Cloudflare (nameservers pointed from GoDaddy)
- **Forms:** Cloudflare Pages Function + Resend, with Turnstile for spam
- **Analytics:** Cloudflare Web Analytics (cookieless — no consent banner needed)
- **Ongoing cost to client: $0/month** beyond existing domain renewals

### Domains
- Client owns `islandmeetsitaly.com` and `islandmeetsitaly.ca` via GoDaddy
- `.com` primary; `.ca` → 301 redirect to `.com` (Cloudflare Redirect Rule)
- Registrations stay at GoDaddy in Kenton's name — only nameservers change

### SEO
- Mobile-first responsive, fast-loading images
- Clean page titles and meta descriptions
- Target terms: Chef Kenton Lowrie, Island Meets Italy, Jamaican-Italian fusion, cookbook
- `sitemap.xml`, `robots.txt`, per-page OG images
- Schema: `Person` (Kenton), `Book` (cookbook)

---

## 5. Ownership & access

Client explicitly requires full ownership and admin access.

- Domains remain registered in Kenton's name at GoDaddy
- Cloudflare account created **under Kenton's email**, Vansh added as collaborator
- Repo under Kenton's GitHub, or transferred at handoff
- Nothing registered in the builder's name

**Nameserver change — three options offered:**
1. Vansh sends the two nameserver values + instructions; Kenton does it himself *(preferred)*
2. Screen-share call, Kenton logged in, Vansh walks him through
3. Vansh handles directly with account access

> Option 3 carries risk — the GoDaddy account holds other domains and payment methods. Prefer 1 or 2. If 3 happens, ask Kenton to change the password afterwards.

---

## 6. Commercial

- **Agreed range:** ~$500 CAD (Raj and Kenton discussed ~$500 before scope was known)
- **Market rate for this scope:** $1,500–3,500 CAD (Toronto freelancer), $4,000+ (studio)
- **Realistic effort:** 25–35 hours
- **Decision:** hold at $500 — friend-of-friend referral, portfolio piece

### Terms to state on the call
- 50% deposit, 50% on launch
- Two rounds of revisions, then hourly
- Excludes photography, copywriting, e-commerce
- Content deadline — if copy is late, the timeline moves
- Optional post-launch: ~$60/mo for hosting, backups, small updates

### Protection at this price
The written scope matters more than the number. Get the shop question answered in writing before starting.

---

## 7. Assets needed from client

**Visual**
- [ ] Logo — vector (.ai / .eps / .svg), else highest-res PNG
- [ ] Exact hex codes for black / gold / emerald
- [ ] Brand fonts (or names + licence)
- [ ] Cookbook cover artwork
- [ ] Author photo
- [ ] All food photography, full resolution
- [ ] Media kit PDF

**Written (client-supplied)**
- [ ] About story — background, heritage, influence, philosophy
- [ ] Homepage brand story
- [ ] Cookbook description
- [ ] Key book info — format, page count, publication date, ISBN

**Details**
- [ ] Social media URLs + which to display
- [ ] Contact email for form submissions and footer
- [ ] Press/media list (or confirm section built empty)

> Written copy is the usual bottleneck. Set a hard date.

---

## 8. Open questions (in intro email)

1. **Shop** — brand site only for now, purchase button links out once book is on sale?
2. **Cookbook** — published or upcoming? Print, digital, or both? Where sold?
3. **Photography rights** — shot professionally? Rights confirmed for web use? Photographer credit needed?

---

## 9. Status log

| Date | Event |
|---|---|
| 21 Aug 2026 | Kenton sends detailed design & layout brief to Raj |
| 21 Aug 2026 | Kenton follows up asking about platform and hosting |
| 22 Aug 2026 | Raj forwards to Vansh |
| 25 Aug 2026 | Intro email drafted in Gmail — to Kenton, CC Raj. Pending send. |

### Next steps
1. Send intro email (CC Raj)
2. Get shop scope confirmed in writing
3. Collect assets + copy
4. Confirm price and terms on call
5. Homepage layout direction for approval
6. Build remaining pages
7. Domain connection + handoff
