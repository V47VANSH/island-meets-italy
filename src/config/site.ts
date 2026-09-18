/**
 * The single swap point.
 *
 * Every value the client has not yet supplied lives here as `null` and nowhere
 * else. When Kenton or David sends a value it changes in this file only — no
 * template edits. See build context §10 and §14.
 *
 * Null-handling contract (§10):
 *   isbn / publicationDate  -> row renders with the value `Pending`, same layout
 *   purchaseUrl             -> BUY THE BOOK points at /cookbook, no visual difference
 *   contact.email           -> mailto link omitted, the form still works
 *   social links            -> render nothing at all, no placeholder icons
 *
 * Never render an empty state, a broken link, or a "coming soon" label on a
 * public page. And never a telephone number — explicit client prohibition.
 */

export const site = {
  name: 'Island Meets Italy',
  tagline: 'Where Island Soul Meets Italian Heart',
  url: 'https://islandmeetsitaly.com',
  legalName: 'Island Meets Italy Inc.',

  chef: {
    name: 'Chef Kenton Lowrie',
    title: 'Professional Chef • Author • Founder',
    /** Approved author photograph, delivered 29 Aug 2026. */
    photo: 'kenton-lowrie.jpg',
  },

  book: {
    /** Display title, as the cover lockup sets it. */
    title: 'Island Meets Italy',
    volume: 'Volume 1 — Foundations of Flavor',
    /**
     * The formal title, supplied by the client 18 Sep 2026. Used for the Title
     * row of the book-information table and for JSON-LD `name` — anywhere the
     * book is being *catalogued* rather than displayed. The hero lockup keeps
     * `title` + `volume`, which is the designed treatment and the approved
     * copy in build-context §7.3.
     */
    fullTitle:
      'Island Meets Italy: Jamaican-Italian Fusion Recipes, Volume 1: Foundations of Flavor',
    author: 'Chef Kenton Lowrie',
    publisher: 'Island Meets Italy Inc.',
    /** Hardcover, not paperback — the edition changed 18 Sep 2026. */
    format: 'Hardcover',
    distribution: 'KDP + IngramSpark',
    /** PENDING — confirmed after the final hardcover layout. */
    pages: null as number | null,
    language: 'English',
    /** PENDING — retail price is set once the hardcover is costed. */
    price: null as string | null,
    priceValue: null as number | null,
    currency: 'CAD',
    /**
     * INTERIM. Extracted from page 2 of the Author & Book Media Kit PDF at the
     * highest resolution that document contains (1819x2355). It is a page
     * render, not the source artwork — a standalone high-resolution cover file
     * should replace it before launch. Drop it at src/assets/book/cover.jpg.
     */
    coverImage: 'cover.jpg' as string | null,
    isbn: '978-1-0680838-1-5' as string | null,
    /** Display form. `publicationDateISO` is what JSON-LD gets. */
    publicationDate: 'October 2026' as string | null,
    /** ISO 8601 year-month — a valid schema.org Date. */
    publicationDateISO: '2026-10' as string | null,
    purchaseUrl: null as string | null,       // PENDING — falls back to /cookbook
  },

  contact: {
    /**
     * Supplied by the client 18 Sep 2026. This address renders publicly — in
     * the footer, on the contact page and as the Media Inquiries destination —
     * so it goes live the moment this is deployed.
     */
    email: 'info@islandmeetsitaly.com' as string | null,
    // phone: NEVER. Client prohibition.

    /**
     * Where the contact form delivers. Setting this is necessary but not
     * sufficient: the endpoint still returns 503 in production until
     * RESEND_API_KEY is in the deploy environment, because a "success" that
     * sent nothing is worse than an honest failure (§17).
     */
    formRecipient: 'info@islandmeetsitaly.com' as string | null,
  },

  social: {
    instagram: null as string | null,         // PENDING
    facebook: null as string | null,          // PENDING
    linkedin: null as string | null,          // PENDING
    tiktok: null as string | null,            // PENDING
    youtube: null as string | null,           // PENDING
  },

  mediaKit: {
    path: '/media-kit.pdf',
    isFinal: false,          // flip when final PDF arrives
    /**
     * PENDING. No PDF has been delivered — not even the proof §4.6 refers to.
     * While this is false the download button does not render at all, because
     * a button that 404s is exactly the broken link §10 forbids. Drop the file
     * at `public/media-kit.pdf` and flip this to true; nothing else changes.
     */
    /**
     * A placeholder PDF ships at public/media-kit.pdf so the download works
     * today. `isFinal` flips when the real Author & Book Media Kit lands; the
     * button looks and behaves identically either way.
     */
    available: true,
  },

  nav: [
    { label: 'HOME',     href: '/' },
    { label: 'ABOUT',    href: '/about' },
    { label: 'COOKBOOK', href: '/cookbook' },
    { label: 'GALLERY',  href: '/gallery' },
    { label: 'MEDIA',    href: '/media' },
    { label: 'CONTACT',  href: '/contact' },
  ],

  /**
   * Cloudflare Turnstile (§7.6). PENDING — the widget renders only once a site
   * key exists, and the endpoint only verifies once a secret is configured, so
   * the form works today and gains spam protection the moment keys are added.
   * The secret belongs in the deployment environment, never in this file.
   */
  turnstile: {
    siteKey: null as string | null,
  },

  inquiryTypes: [
    'General Inquiry',
    'Media & Press',
    'Partnerships',
    'Speaking / Appearances',
    'Business Inquiry',
  ],
} as const;

/** BUY THE BOOK destination. Points at /cookbook until the live URL exists. */
export const buyUrl: string = site.book.purchaseUrl ?? '/cookbook';

/** Value shown for book-info rows whose data has not arrived yet (§10). */
export const PENDING_LABEL = 'Pending';

/**
 * Social links that actually have a URL, in display order. Empty until the
 * client supplies them — callers render nothing rather than an empty state.
 */
export const socialLinks: { label: string; href: string }[] = (
  [
    { label: 'Instagram', href: site.social.instagram },
    { label: 'Facebook', href: site.social.facebook },
    { label: 'LinkedIn', href: site.social.linkedin },
    { label: 'TikTok', href: site.social.tiktok },
    { label: 'YouTube', href: site.social.youtube },
  ] as { label: string; href: string | null }[]
).filter((s): s is { label: string; href: string } => s.href !== null);

/** `sameAs` for JSON-LD. Omitted entirely when no socials are known (§12). */
export const sameAs: string[] = socialLinks.map((s) => s.href);
