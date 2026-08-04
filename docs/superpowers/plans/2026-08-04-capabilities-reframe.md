# Capabilities Reframe Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reframe the site around abilities/capabilities instead of project timeline and status — remove the `active`/`shipped`/`ended` system, lead the homepage with a capabilities statement, and present projects (with role + capability tags, dates demoted) as evidence of capability.

**Architecture:** Static Astro site. Changes ripple from a content-collection schema change through the shared `EntryRow` component and the pages that render projects. Tasks are dependency-ordered so the site **builds green after every task**: presentation props and capability data are added first (additive, non-breaking), consumers are migrated next, and the dead status system is deleted last.

**Tech Stack:** Astro 7, Tailwind v4 (`@theme`/semantic tokens in `global.css`), astro content collections (Zod schema), pnpm.

## Global Constraints

- **Verification gate:** `pnpm build` must succeed after every task. Astro validates content frontmatter against the schema at build time, so schema/frontmatter drift fails the build. (`@astrojs/check` is not installed — build is the gate, not `astro check`.)
- **Styling:** Tailwind utility classes with semantic Flexoki tokens only (`text-tx-3`, `border-ui`, `text-accent`, etc.). No arbitrary bracket values for size/spacing/font — use standard scale utilities. No new scoped `<style>` blocks; reuse existing `@layer components` classes (`.label`, `.link-ui`, `.page-head`, `.page-title`, `.container max-w-3xl`).
- **Dev server:** `astro dev --background` (manage with `astro dev stop|status|logs`). Do not run a blocking `astro dev`.
- **Copy is author-owned:** the homepage capabilities sentence, the `/projects` description, and the seed capability tags are the approved starting drafts from the spec — implement them verbatim; the author edits later.
- **Do not touch:** writing rows/index, art, the ASCII band, `SITE_DESCRIPTION`, or case-study prose (year mentions stay).

Reference spec: `docs/superpowers/specs/2026-08-04-capabilities-reframe-design.md`

---

### Task 1: Add `tags` + `meta` presentation props to `EntryRow` (additive)

Add two optional props so a row can show capability tags and a demoted date. Purely additive — `status`/`StatusMark` stay for now; writing rows (which pass neither new prop) render identically.

**Files:**
- Modify: `src/components/EntryRow.astro`

**Interfaces:**
- Consumes: nothing new.
- Produces: `EntryRow` accepts `tags?: string[]` (rendered as a muted `·`-joined inline list in the label line) and `meta?: string` (rendered as a demoted muted line under the description). `rail`, `label`, `status` unchanged.

- [ ] **Step 1: Rewrite `EntryRow.astro` with the new props**

```astro
---
import type { PROJECT_STATUS } from '../consts';
import StatusMark from './StatusMark.astro';

interface Props {
	href: string;
	rail: string;
	label: string;
	title: string;
	description: string;
	status?: keyof typeof PROJECT_STATUS;
	/** Capability tags, shown muted in the label line (e.g. project rows). */
	tags?: string[];
	/** Demoted secondary line under the description (e.g. a date span). */
	meta?: string;
}

const { href, rail, label, title, description, status, tags, meta } =
	Astro.props;
---

<li class="border-t border-ui">
	<a
		href={href}
		class="group grid gap-x-8 gap-y-1.5 py-7 no-underline md:grid-cols-[7rem_1fr]"
	>
		<span class="label text-tx-3 max-md:hidden">{rail}</span>
		<span class="block">
			<span class="label flex flex-wrap items-center gap-x-2 gap-y-1 text-tx-3">
				{status && <StatusMark status={status} />}
				{label && <span>{label}</span>}
				{tags && tags.length > 0 && <span>{tags.join(' · ')}</span>}
				<span class="md:hidden">· {rail}</span>
			</span>
			<h2
				class="text-2xl mt-2 font-serif text-tx transition-colors duration-150 group-hover:text-accent"
			>
				{title}
			</h2>
			<p class="mt-1.5 text-tx-2">{description}</p>
			{meta && <span class="label mt-2 block text-tx-3">{meta}</span>}
		</span>
	</a>
</li>
```

- [ ] **Step 2: Build**

Run: `pnpm build`
Expected: succeeds. Writing index/rows look unchanged (no `tags`/`meta` passed).

- [ ] **Step 3: Commit**

```bash
git add src/components/EntryRow.astro
git commit -m "Add tags and meta props to EntryRow"
```

---

### Task 2: Add `capabilities` to the schema and project frontmatter

Add the capability field (optional), relax `startDate` to optional, and seed the two existing projects with tags. `status` stays required for now (still consumed by the pages until Task 6), so the build stays green.

**Files:**
- Modify: `src/content.config.ts`
- Modify: `src/content/projects/impact-labs.mdx` (frontmatter only)
- Modify: `src/content/projects/plotpoint.mdx` (frontmatter only)

**Interfaces:**
- Produces: `project.data.capabilities?: string[]` and `project.data.startDate?: Date` available to all project pages.

- [ ] **Step 1: Update the `projects` schema**

In `src/content.config.ts`, change the `projects` schema so `startDate` is optional and add `capabilities`. Leave `status` as-is for now:

```ts
const projects = defineCollection({
  loader: glob({ base: "./src/content/projects", pattern: "**/*.{md,mdx}" }),
  schema: z.object({
    title: z.string(),
    // One line. Shown on the projects index, under the title.
    description: z.string(),
    status: z.enum(["active", "shipped", "ended"]),
    startDate: z.coerce.date().optional(),
    // Leave this off while the project is still going.
    endDate: z.coerce.date().optional(),
    // What I did on it, e.g. "Founder", "Founder & engineer".
    role: z.string().optional(),
    // Capability tags, e.g. ["Product design", "Full-stack", "0→1"].
    capabilities: z.array(z.string()).optional(),
    // Where to see the thing itself.
    url: z.string().url().optional(),
    draft: z.boolean().default(false),
  }),
});
```

- [ ] **Step 2: Add `capabilities` to `impact-labs.mdx` frontmatter**

Add this line to the frontmatter block (keep `status` for now):

```yaml
capabilities: ['Product design', '0→1', 'Data modeling']
```

- [ ] **Step 3: Add `capabilities` to `plotpoint.mdx` frontmatter**

```yaml
capabilities: ['Product design', 'Full-stack', '0→1']
```

- [ ] **Step 4: Build**

Run: `pnpm build`
Expected: succeeds (additive/optional schema change; frontmatter validates).

- [ ] **Step 5: Commit**

```bash
git add src/content.config.ts src/content/projects/impact-labs.mdx src/content/projects/plotpoint.mdx
git commit -m "Add capabilities field and seed project tags"
```

---

### Task 3: Reframe the homepage

Replace the timeline narrative with a capabilities statement and add a "Selected work" projects section. Homepage stops reading `status`.

**Files:**
- Modify: `src/pages/index.astro`

**Interfaces:**
- Consumes: `EntryRow` `tags`/`meta` (Task 1); `capabilities`/optional `startDate` (Task 2); `span()` from `src/utils/dates.ts`.

- [ ] **Step 1: Rewrite `index.astro`**

Remove the `StatusMark` import, the `active`/`past` split, and the `joiner` helper. Add a projects list sorted by recency (undated last) and a "Selected work" section.

```astro
---
import { getCollection } from 'astro:content';
import AsciiFrame from '../components/ascii/AsciiFrame.astro';
import EntryRow from '../components/EntryRow.astro';
import { SITE_DESCRIPTION, SITE_TITLE } from '../consts';
import Base from '../layouts/Base.astro';
import { monthYear, span } from '../utils/dates';

const projects = (await getCollection('projects', (p) => !p.data.draft))
	.sort(
		(a, b) =>
			(b.data.startDate?.valueOf() ?? 0) - (a.data.startDate?.valueOf() ?? 0),
	)
	.slice(0, 3);

const posts = (await getCollection('writing', (p) => !p.data.draft))
	.sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf())
	.slice(0, 3);
---

<Base title={SITE_TITLE} description={SITE_DESCRIPTION}>
	<AsciiFrame />

	<div class="container max-w-3xl pt-10 max-md:pt-4">
		<p class="rise text-2xl">
			I’m Shub. I make things.
		</p>

		<p class="rise mt-6 text-tx-2 [animation-delay:120ms]">
			I design and build products end‑to‑end — from the first sketch to the
			thing in someone’s hands. I’ve founded companies and shipped apps, and I
			can carry a product across design, engineering, and story.
		</p>

		<p class="rise mt-6 text-tx-2 [animation-delay:240ms]">
			In between I write —{' '}
			<a href="/writing/" class="link-underline text-tx whitespace-nowrap">essays</a>, and
			notes on whatever I’m reading — and I paint.
		</p>
	</div>

	{
		projects.length > 0 && (
			<section class="container max-w-3xl mt-20 max-md:mt-14">
				<h2 class="label mb-4 text-tx-3">Selected work</h2>
				<ul>
					{projects.map((project) => (
						<EntryRow
							href={`/projects/${project.id}/`}
							rail={project.data.role ?? ''}
							label=""
							tags={project.data.capabilities}
							meta={
								project.data.startDate
									? span(project.data.startDate, project.data.endDate)
									: undefined
							}
							title={project.data.title}
							description={project.data.description}
						/>
					))}
				</ul>
				<a href="/projects/" class="label link-ui mt-6 inline-block text-tx-3">
					All projects →
				</a>
			</section>
		)
	}

	{
		posts.length > 0 && (
			<section class="container max-w-3xl mt-20 max-md:mt-14">
				<h2 class="label mb-4 text-tx-3">Latest writing</h2>
				<ul>
					{posts.map((post) => (
						<EntryRow
							href={`/writing/${post.id}/`}
							rail={monthYear(post.data.pubDate)}
							label={post.data.publication}
							title={post.data.title}
							description={post.data.description}
						/>
					))}
				</ul>
				<a href="/writing/" class="label link-ui mt-6 inline-block text-tx-3">
					All writing →
				</a>
			</section>
		)
	}
</Base>
```

- [ ] **Step 2: Build**

Run: `pnpm build`
Expected: succeeds.

- [ ] **Step 3: Visual check**

Run: `astro dev --background`, open the site root. Confirm: no "Right now / Before that" narrative, the capabilities sentence is present, and "Selected work" lists the projects with role (left rail on desktop) + capability tags, no status dots.

- [ ] **Step 4: Commit**

```bash
git add src/pages/index.astro
git commit -m "Reframe homepage around capabilities"
```

---

### Task 4: Reframe the projects index

Drop the status/count meta and the "including the ones that ended" description; lead rows with role + tags, demote dates, tolerate optional dates.

**Files:**
- Modify: `src/pages/projects/index.astro`

**Interfaces:**
- Consumes: `EntryRow` `tags`/`meta` (Task 1); `capabilities`/optional `startDate` (Task 2); `span()`.

- [ ] **Step 1: Rewrite `projects/index.astro`**

```astro
---
import { getCollection } from 'astro:content';
import EntryRow from '../../components/EntryRow.astro';
import { SITE_TITLE } from '../../consts';
import Base from '../../layouts/Base.astro';
import { span } from '../../utils/dates';

// Recency as a sensible default; undated projects sort last.
const projects = (await getCollection('projects', (p) => !p.data.draft)).sort(
	(a, b) =>
		(b.data.startDate?.valueOf() ?? 0) - (a.data.startDate?.valueOf() ?? 0),
);

const description = 'Things I’ve designed and built.';
---

<Base title={`Projects · ${SITE_TITLE}`} description={description}>
	<div class="container max-w-3xl">
		<header class="page-head">
			<h1 class="page-title">
				Projects
			</h1>
			<p class="mt-3 text-tx-2">{description}</p>
		</header>

		{
			projects.length > 0 ? (
				<ul>
					{projects.map((project) => (
						<EntryRow
							href={`/projects/${project.id}/`}
							rail={project.data.role ?? ''}
							label=""
							tags={project.data.capabilities}
							meta={
								project.data.startDate
									? span(project.data.startDate, project.data.endDate)
									: undefined
							}
							title={project.data.title}
							description={project.data.description}
						/>
					))}
				</ul>
			) : (
				<p class="empty-state">
					Nothing here yet. The first project goes in{' '}
					<code>src/content/projects/</code>.
				</p>
			)
		}
	</div>
</Base>
```

- [ ] **Step 2: Build**

Run: `pnpm build`
Expected: succeeds. Note: `PROJECT_STATUS` import is now gone from this file (it still exists in `consts.ts` until Task 6).

- [ ] **Step 3: Visual check**

Open `/projects`. Confirm: new description, no "N total · M active" line, no status dots, rows lead with role + capability tags, dates appear demoted under the description.

- [ ] **Step 4: Commit**

```bash
git add src/pages/projects/index.astro
git commit -m "Reframe projects index around capabilities"
```

---

### Task 5: Reframe the project detail header

Remove the status line from the detail header; lead with role + capability tags, demote the date. Keep the `url` link and "Related writing" untouched.

**Files:**
- Modify: `src/layouts/Entry.astro`
- Modify: `src/pages/projects/[...slug].astro`

**Interfaces:**
- Consumes: `capabilities`/optional `startDate` (Task 2); `span()`.
- Produces: `Entry` layout no longer accepts `status`; it accepts `tags?: string[]` and treats `rail` as the demoted date. `subtitle` (role) is unchanged.

- [ ] **Step 1: Update `Entry.astro`**

Remove the `StatusMark` import and `status` prop. Add `tags?: string[]` into the existing `label`-left / `rail`-right meta row. This keeps the **writing** detail header pixel-identical (it passes `label`=publication, `rail`=date, no `tags`) while letting projects lead the muted row with capability tags and demote the date to the right. Full file:

```astro
---
import Base from './Base.astro';

interface Props {
	title: string;
	description: string;
	label: string;
	rail: string;
	subtitle?: string;
	tags?: string[];
	url?: string;
	updatedNote?: string;
	backHref: string;
	backLabel: string;
	canonicalURL?: string;
}

const {
	title,
	description,
	label,
	rail,
	subtitle,
	tags,
	url,
	updatedNote,
	backHref,
	backLabel,
	canonicalURL,
} = Astro.props;

const displayUrl = url?.replace(/^https?:\/\//, '').replace(/\/$/, '');
---

<Base title={title} description={description} canonicalURL={canonicalURL}>
	<article class="container max-w-3xl prose">
		<header class="pt-6">
			<a href={backHref} class="label link-ui text-tx-3">
				← {backLabel}
			</a>

			<div class="label mt-4 flex items-center justify-between gap-4 text-tx-3">
				<span class="flex flex-wrap items-center gap-2">
					{label && <span>{label}</span>}
					{tags && tags.length > 0 && <span>{tags.join(' · ')}</span>}
				</span>
				<span>{rail}</span>
			</div>

			<h1 class="page-title mt-5">
				{title}
			</h1>

			{subtitle && <p class="mt-3 text-tx-2 italic">{subtitle}</p>}

			{
				url && (
					<p class="mt-5">
						<a
							href={url}
							target="_blank"
							rel="noopener"
							class="label link-ui text-tx-2"
						>
							{displayUrl} ↗
						</a>
					</p>
				)
			}
		</header>

		<div class="prose mt-10">
			<slot />
		</div>

		<slot name="related" />

		{
			updatedNote && (
				<footer class="mt-14 border-t border-ui pt-6">
					<span class="label text-tx-3">{updatedNote}</span>
				</footer>
			)
		}
	</article>
</Base>
```

Note: `label` is kept in the interface because the writing detail page (`writing/[...slug].astro`) also uses this layout and passes a `label` (publication). For projects it will be `""`.

- [ ] **Step 2: Verify the writing detail page still passes valid props**

Run: `grep -n "status" src/pages/writing/[...slug].astro`
Expected: no matches (writing never used `status`, so removing it from `Entry` doesn't break it). If any match appears, stop and reconcile before continuing.

- [ ] **Step 3: Update `projects/[...slug].astro`**

Stop importing/using `PROJECT_STATUS`. Pass role as `subtitle`, capabilities as `tags`, the demoted date as `rail`, and `label=""`. Full file:

```astro
---
import { type CollectionEntry, getCollection, render } from 'astro:content';
import EntryRow from '../../components/EntryRow.astro';
import Entry from '../../layouts/Entry.astro';
import { monthYear, span } from '../../utils/dates';

export async function getStaticPaths() {
	const projects = await getCollection('projects', (p) => !p.data.draft);
	return projects.map((project) => ({
		params: { slug: project.id },
		props: project,
	}));
}
type Props = CollectionEntry<'projects'>;

const project = Astro.props;
const { Content } = await render(project);
const { title, description, startDate, endDate, role, capabilities, url } =
	project.data;

// Writing that points at this project, newest first.
const related = (
	await getCollection(
		'writing',
		(p) => !p.data.draft && p.data.project === project.id,
	)
).sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());
---

<Entry
	title={title}
	description={description}
	label=""
	tags={capabilities}
	rail={startDate ? span(startDate, endDate) : ''}
	subtitle={role}
	url={url}
	backHref="/projects/"
	backLabel="All projects"
>
	<Content />

	{
		related.length > 0 && (
			<section slot="related" class="mt-16">
				<h2 class="label text-tx-3">Related writing</h2>
				<ul class="mt-4">
					{related.map((post) => (
						<EntryRow
							href={`/writing/${post.id}/`}
							rail={monthYear(post.data.pubDate)}
							label={post.data.publication}
							title={post.data.title}
							description={post.data.description}
						/>
					))}
				</ul>
			</section>
		)
	}
</Entry>
```

- [ ] **Step 4: Build**

Run: `pnpm build`
Expected: succeeds.

- [ ] **Step 5: Visual check**

Open `/projects/plotpoint/` and `/projects/impact-labs/`. Confirm: no status dot/label at the top, capability tags lead the muted meta row with the date demoted to its right, role shows as the italic subtitle, and the case-study prose (with year mentions) is unchanged. Also open one writing post (e.g. `/writing/what-is-validation/`) and confirm its header is unchanged (publication left, date right).

- [ ] **Step 6: Commit**

```bash
git add src/layouts/Entry.astro src/pages/projects/[...slug].astro
git commit -m "Reframe project detail header around capabilities"
```

---

### Task 6: Delete the dead status system

Nothing renders `status` anymore. Remove it from the schema, both frontmatter files, `consts.ts`, delete `StatusMark.astro`, and remove the now-unused optional `status` prop from `EntryRow`.

**Files:**
- Modify: `src/content.config.ts`
- Modify: `src/content/projects/impact-labs.mdx` (frontmatter only)
- Modify: `src/content/projects/plotpoint.mdx` (frontmatter only)
- Modify: `src/consts.ts`
- Modify: `src/components/EntryRow.astro`
- Delete: `src/components/StatusMark.astro`

- [ ] **Step 1: Confirm only `EntryRow` + the definitions still reference the status system**

Run: `grep -rnE "PROJECT_STATUS|StatusMark" src/`
Expected: hits only in `src/consts.ts` (the `PROJECT_STATUS` definition), `src/components/StatusMark.astro` (the component itself), and `src/components/EntryRow.astro` (its `import type { PROJECT_STATUS }` and `import StatusMark`). All three are removed in this task. If any page (`index.astro`, `projects/index.astro`, `[...slug].astro`) or `Entry.astro` still matches, an earlier task was left incomplete — stop and finish it first.

- [ ] **Step 2: Remove `status` from the schema**

In `src/content.config.ts`, delete the line:

```ts
    status: z.enum(["active", "shipped", "ended"]),
```

- [ ] **Step 3: Remove `status` from both frontmatter files**

Delete the `status: 'ended'` line from `impact-labs.mdx` and the `status: 'shipped'` line from `plotpoint.mdx`. Leave `capabilities`, `startDate`, `endDate`, `role` intact.

- [ ] **Step 4: Remove `PROJECT_STATUS` from `consts.ts`**

Delete this block (and the comment above it):

```ts
// The status ledger. `dot` picks how the mark next to a project is drawn.
export const PROJECT_STATUS = {
  active: { label: "Active", dot: "live" },
  shipped: { label: "Shipped", dot: "solid" },
  ended: { label: "Ended", dot: "hollow" },
} as const;
```

- [ ] **Step 5: Remove the `status` prop from `EntryRow.astro`**

Delete the `import type { PROJECT_STATUS }` line, the `import StatusMark` line, the `status?: keyof typeof PROJECT_STATUS;` prop, `status` from the destructure, and the `{status && <StatusMark status={status} />}` render. The label line becomes:

```astro
			<span class="label flex flex-wrap items-center gap-x-2 gap-y-1 text-tx-3">
				{label && <span>{label}</span>}
				{tags && tags.length > 0 && <span>{tags.join(' · ')}</span>}
				<span class="md:hidden">· {rail}</span>
			</span>
```

- [ ] **Step 6: Delete `StatusMark.astro`**

```bash
git rm src/components/StatusMark.astro
```

- [ ] **Step 7: Confirm the status system is fully gone**

Run: `grep -rnE "PROJECT_STATUS|StatusMark|\.data\.status|status=\{|status:" src/`
Expected: no matches. (Two unrelated, benign strings remain and are fine to ignore: a comment in `src/styles/global.css` mentioning "status labels", and prose in `src/content/art/placeholder-art.md` — neither is code. Do not grep bare `status`, which hits both.)

- [ ] **Step 8: Build**

Run: `pnpm build`
Expected: succeeds. Content frontmatter validates against the trimmed schema.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "Remove the project status system"
```

---

## Self-Review

**Spec coverage:**
- Data model (remove `status`, optional `startDate`, add `capabilities`) → Tasks 2 + 6. ✓
- Remove `PROJECT_STATUS` / `StatusMark` → Task 6. ✓
- Homepage capabilities statement + Selected work → Task 3. ✓
- Project rows lead with role + tags, dates demoted → Tasks 1, 3, 4. ✓
- Project detail header reframe → Task 5. ✓
- `/projects` copy cleanup (description + drop total/active) → Task 4. ✓
- Seed capability tags → Task 2. ✓
- Non-goals (writing/art/ascii/prose/SITE_DESCRIPTION untouched) → respected; only listed files change. ✓

**Type consistency:** `EntryRow` props `tags?: string[]` / `meta?: string` used consistently in Tasks 3–4. `Entry` props `tags?: string[]`, `rail` (date), `subtitle` (role), `label` used consistently in Task 5. `span(startDate, endDate)` matches `src/utils/dates.ts` signature. `startDate?` optionality guarded with `?.valueOf() ?? 0` and `startDate ? … : ''/undefined` everywhere it's read.

**Placeholder scan:** No TBD/TODO; every code step shows full file or exact edit.
