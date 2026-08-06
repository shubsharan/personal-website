import { defineCollection } from "astro:content";
import { file, glob } from "astro/loaders";
import { z } from "astro/zod";

const writing = defineCollection({
  loader: glob({ base: "./src/content/writing", pattern: "**/*.{md,mdx}" }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    publication: z
      .enum(["Failing Loudly", "Book Reviews", "Essays"])
      .default("Essays"),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    canonicalURL: z.url().optional(),
    draft: z.boolean().default(false),
  }),
});

// A flat photo grid, Instagram-style. Each row points at an image in
// `public/art/` and carries alt text plus an optional caption/date.
const art = defineCollection({
  loader: file("src/content/art.yaml"),
  schema: z.object({
    // Path under `public/`, e.g. "/art/piece-01.jpg".
    src: z.string(),
    // Alt text for the grid image and lightbox.
    alt: z.string(),
    // Optional line shown in the lightbox.
    caption: z.string().optional(),
    createdDate: z.coerce.date().optional(),
  }),
});

const experience = defineCollection({
  loader: file("src/content/experience.yaml"),
  schema: z.object({
    // Role/title, e.g. "Senior Product Manager, Enterprise".
    title: z.string(),
    // Company/organization.
    org: z.string(),
    startDate: z.coerce.date(),
    // Leave off while the role is current.
    endDate: z.coerce.date().optional(),
    // One line.
    description: z.string(),
    // Optional external link.
    url: z.string().url().optional(),
  }),
});

export const collections = { writing, art, experience };
