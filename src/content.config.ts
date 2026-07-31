import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

const projects = defineCollection({
  loader: glob({ base: "./src/content/projects", pattern: "**/*.{md,mdx}" }),
  schema: z.object({
    title: z.string(),
    // One line. Shown on the projects index, under the title.
    description: z.string(),
    status: z.enum(["active", "shipped", "ended"]),
    startDate: z.coerce.date(),
    // Leave this off while the project is still going.
    endDate: z.coerce.date().optional(),
    // What I did on it, e.g. "Founder", "Founder & engineer".
    role: z.string().optional(),
    // Where to see the thing itself.
    url: z.string().url().optional(),
    draft: z.boolean().default(false),
  }),
});

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
  loader: glob({ base: "./src/content/art", pattern: "**/*.{md,mdx}" }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    createdDate: z.coerce.date(),
  }),
});

export const collections = { projects, writing, art };
