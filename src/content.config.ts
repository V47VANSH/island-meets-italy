/**
 * Content collections (§10.1).
 *
 * The schemas are exactly as specified. The loader syntax is Astro 5's Content
 * Layer API — §10.1 was written against Astro 4's `type: 'data'`, which Astro 5
 * (mandated by §8) only accepts behind the deprecated `legacy.collections` flag.
 * Field-for-field the shape is unchanged.
 *
 * `plateTone` is what lets a component pick the right room automatically — it
 * exists because of the four-photograph constraint in §5.2.
 *
 * Adding a fifth dish, or the first press entry, is a data change. No template
 * touches it.
 */
import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const dishes = defineCollection({
  loader: glob({ pattern: '**/*.json', base: './src/content/dishes' }),
  schema: ({ image }) =>
    z.object({
      name: z.string(),
      shortName: z.string(),
      image: image(),
      alt: z.string(), // descriptive — required by client
      plateTone: z.enum(['dark', 'light']),
      order: z.number(),
      featured: z.boolean().default(false),
    }),
});

const press = defineCollection({
  loader: glob({ pattern: '**/*.json', base: './src/content/press' }),
  schema: z.object({
    outlet: z.string(),
    title: z.string(),
    url: z.string().url(),
    date: z.coerce.date(),
    type: z.enum(['article', 'podcast', 'tv', 'radio', 'feature']),
  }),
});

export const collections = { dishes, press };
