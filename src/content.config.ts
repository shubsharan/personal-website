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

const art = defineCollection({
  loader: file("src/content/art.yaml"),
  schema: z.object({
    src: z.string(),
    alt: z.string(),
    caption: z.string().optional(),
    createdDate: z.coerce.date().optional(),
  }),
});

const experience = defineCollection({
  loader: file("src/content/experience.yaml"),
  schema: z.object({
    title: z.string(),
    org: z.string(),
    startDate: z.coerce.date(),
    endDate: z.coerce.date().optional(),
    description: z.string(),
    url: z.string().url().optional(),
  }),
});

export const collections = { writing, art, experience };
