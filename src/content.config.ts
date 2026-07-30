import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

/*
 * Things I've built or am building. `status` is the honest one: a project that
 * ended says so, in the same place an active one says it's alive.
 */
const projects = defineCollection({
	loader: glob({ base: './src/content/projects', pattern: '**/*.{md,mdx}' }),
	schema: z.object({
		title: z.string(),
		// One line. Shown on the projects index, under the title.
		description: z.string(),
		status: z.enum(['active', 'shipped', 'ended']),
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

/*
 * Essays, book reviews, and short notes. `kind` is what the reader sees before
 * the title, so it describes the shape of the piece, not its topic.
 */
const writing = defineCollection({
	loader: glob({ base: './src/content/writing', pattern: '**/*.{md,mdx}' }),
	schema: z.object({
		title: z.string(),
		description: z.string(),
		kind: z.enum(['essay', 'review', 'note']).default('essay'),
		pubDate: z.coerce.date(),
		updatedDate: z.coerce.date().optional(),
		// For reviews: the work under discussion, e.g. "Robert Caro, The Power Broker".
		subject: z.string().optional(),
		draft: z.boolean().default(false),
	}),
});

export const collections = { projects, writing };
