// @ts-check
import { site as siteConfig } from './src/config/site.ts';
import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

/**
 * NOTE — @astrojs/react is installed (§8.1) but deliberately not wired in yet.
 *
 * On this Astro 5 / rolldown-vite combination its Fast Refresh wrapper
 * (`builtin:vite-react-refresh-wrapper`) throws "Missing field `moduleType`"
 * when it transforms Astro's virtual script modules, which have no real file
 * path. In dev that means EVERY hoisted `<script>` in the project 500s —
 * the header's scroll and room state, the scroll reveals and the mobile nav
 * all silently stopped working, while `astro build` was perfectly fine.
 *
 * Nothing on the site is a React island today: the mobile nav is plain markup
 * plus a ~1 KB script, which also keeps the page inside the §13 budget of
 * under 40 KB of JS (React alone is 57 KB gzipped).
 *
 * Phase 2: if the contact form or the lightbox genuinely warrant React, add
 * `react()` back to `integrations` below and check dev still serves
 * `/src/**\/*.astro?astro&type=script`. If it 500s, this is why.
 */

/**
 * Fail loudly at build time rather than at 3am when an inquiry vanishes.
 * The contact endpoint refuses to report success in production unless both a
 * recipient and an API key exist, so surface that while the build is running.
 */
function warnIfContactUnconfigured() {
  return {
    name: 'imi:contact-config-warning',
    hooks: {
      'astro:build:done': ({ logger }) => {
        const missing = [];
        if (!siteConfig.contact.formRecipient) missing.push('contact.formRecipient in src/config/site.ts');
        if (!process.env.RESEND_API_KEY) missing.push('RESEND_API_KEY in the deploy environment');
        if (missing.length === 0) return;
        logger.warn(
          'Contact form cannot deliver yet — missing ' +
            missing.join(' and ') +
            '. The endpoint will return 503 in production rather than ' +
            'silently accepting an inquiry. See §17.',
        );
      },
    },
  };
}

// https://astro.build/config
export default defineConfig({
  site: 'https://islandmeetsitaly.com',

  /**
   * Deploys to Cloudflare Workers, not Pages. The six content pages are still
   * prerendered; only src/pages/api/contact.ts opts out with
   * `export const prerender = false` and runs on demand.
   *
   * Pinned to the 12.x line: 13+ requires Astro 6 and 14+ requires Astro 7,
   * and §8 of the build context fixes this project on Astro 5.
   */
  adapter: cloudflare({ imageService: 'compile' }),
  output: 'static',
  integrations: [sitemap(), warnIfContactUnconfigured()],

  /**
   * <ClientRouter /> turns prefetching on, but its default strategy is 'hover',
   * and a phone never hovers — so desktop felt instant while every tap on
   * mobile paid a full round trip before anything moved.
   *
   * 'viewport' does not rescue it either: on a phone the desktop link row is
   * display:none and the overlay is [hidden], so every nav link is invisible
   * and an IntersectionObserver never sees one.
   *
   * 'load' prefetches regardless of visibility or pointer type. The whole site
   * is six static pages of roughly 5 KB gzipped, so this is about 30 KB once,
   * and it makes navigation instant on touch. Astro still skips prefetching on
   * save-data and slow connections.
   */
  prefetch: {
    prefetchAll: true,
    defaultStrategy: 'load',
  },
  vite: {
    plugins: [tailwindcss()],
  },
  image: {
    // Responsive srcset still comes from astro:assets (§13); Astro's injected
    // sizing styles are off because every image here is placed by a bespoke
    // layout that sets its own box.
    responsiveStyles: false,
  },
});
