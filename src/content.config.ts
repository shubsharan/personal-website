import { defineCollection } from "astro:content";
import { file, glob } from "astro/loaders";
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
    // Attach this post to a project (its slug/id, e.g. "plotpoint"). The project
    // case-study page collects everything pointing at it into "Related writing".
    project: z.string().optional(),
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

export const collections = { projects, writing, art, experience };
