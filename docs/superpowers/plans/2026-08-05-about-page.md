# About Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an `/about` page — a prose lede over a scannable, reverse-chronological career timeline that merges founder ventures (auto-pulled from the `projects` collection) with employed roles (a new `experience` data file).

**Architecture:** A new `experience` data collection (single YAML file, Astro `file()` loader) holds employed jobs. `src/pages/about.astro` normalizes both `experience` and `projects` into a common row shape, sorts reverse-chronologically, and renders each through a new compact `TimelineRow.astro` component — a denser sibling of the existing `EntryRow`. "About" is added to `NAV`, which the header maps into both the desktop and mobile menus automatically.

**Tech Stack:** Astro content collections (`glob` + `file` loaders from `astro/loaders`), Zod schemas, Tailwind v4 with semantic Flexoki tokens, EB Garamond serif.

**Testing note:** This repo has **no test framework** — verification for a static content site is build-based and visual, consistent with the rest of the codebase. Each task's verification is `pnpm astro sync` (after schema changes) + `pnpm astro build` (type-checks collections and pages) + a dev-server visual check. There are no unit-test steps because there is no runner to hang them on; do not add one.

## Global Constraints

- **Semantic tokens only** — use `text-tx` / `text-tx-2` / `text-tx-3` / `border-ui` / `text-accent` in markup; never raw palette colors. (from `CLAUDE.md`)
- **Tailwind utilities over scoped `<style>`**; repeated patterns become `@layer components` classes in `src/styles/global.css`. Prefer a component when markup has logic (conditional tag/href).
- **Standard Tailwind scale utilities** (`text-lg`, `py-4`, `gap-2`) over arbitrary bracket values, except where an existing pattern already uses one (`md:grid-cols-[7rem_1fr]` is the established rail grid — reuse it verbatim).
- **`container max-w-3xl`** for page content; follow the `page-head` / `page-title` pattern from `src/pages/projects/index.astro`.
- **EB Garamond serif** (`font-serif`) for titles; `.label` (Inter) for the small tracked/uppercase secondary text.
- **Nav label is exactly `About`; route is exactly `/about`.**
- After any content-collection schema change, run `pnpm astro sync` so types regenerate. (from `CLAUDE.md`)

---

### Task 1: `experience` data collection

Holds the employed (non-project) roles as a single typed YAML file.

**Files:**
- Create: `src/content/experience.yaml`
- Modify: `src/content.config.ts` (add `experience` collection; extend the `astro/loaders` import)

**Interfaces:**
- Produces: a content collection named `experience`, queried via `getCollection('experience')`. Each entry's `.data` has: `title: string`, `org: string`, `startDate: Date`, `endDate?: Date`, `description: string`, `url?: string`. Each entry's `.id` is the YAML `id` field.

- [ ] **Step 1: Create the data file**

Create `src/content/experience.yaml`:

```yaml
- id: regalix-senior-pm
  title: Senior Product Manager, Enterprise
  org: Regalix
  startDate: 2020-01-01
  endDate: 2022-01-01
  description: Built a forward-deployed product practice around a Twilio partnership, from zero to seven-figure revenue.

- id: regalix-pm
  title: Product Manager, Enterprise
  org: Regalix
  startDate: 2018-01-01
  endDate: 2020-01-01
  description: Product lead embedded in SAP Ariba's supply-chain org on a multi-million-dollar lifecycle initiative.

- id: regalix-product-designer
  title: Product Designer
  org: Regalix
  startDate: 2016-01-01
  endDate: 2018-01-01
  description: First design hire for Nytro.ai, an AI-first sales enablement platform; grew into product management.
```

- [ ] **Step 2: Register the collection**

In `src/content.config.ts`, extend the loaders import (currently `import { glob } from "astro/loaders";`) to:

```ts
import { file, glob } from "astro/loaders";
```

Add a new collection definition alongside the others:

```ts
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
```

Add `experience` to the exported collections map:

```ts
export const collections = { projects, writing, art, experience };
```

- [ ] **Step 3: Sync and verify the schema loads**

Run:

```bash
pnpm astro sync && pnpm astro build
```

Expected: build succeeds. The `experience` collection types are generated and the three YAML entries validate against the schema (no Zod errors). If a Zod error names a missing `id`, confirm each YAML entry has its `id` field.

- [ ] **Step 4: Commit**

```bash
git add src/content/experience.yaml src/content.config.ts
git commit -m "Add experience data collection for About timeline"
```

---

### Task 2: `TimelineRow` component

A compact, denser sibling of `EntryRow` for the About timeline. Static `<div>` when there's no link, `<a>` when there is.

**Files:**
- Create: `src/components/TimelineRow.astro`

**Interfaces:**
- Consumes: nothing from earlier tasks.
- Produces: `TimelineRow.astro` with props `{ rail: string; title: string; org?: string; description: string; href?: string }`. Renders one `<li>`. When `href` is set the row is a link; otherwise a static `<div>`.

- [ ] **Step 1: Create the component**

Create `src/components/TimelineRow.astro`:

```astro
---
interface Props {
	rail: string;
	title: string;
	org?: string;
	description: string;
	href?: string;
}

const { rail, title, org, description, href } = Astro.props;
const Tag = href ? 'a' : 'div';
---

<li class="border-t border-ui">
	<Tag
		href={href}
		class="group grid gap-x-8 gap-y-1 py-4 no-underline md:grid-cols-[7rem_1fr]"
	>
		<span class="label text-tx-3 pt-1 max-md:hidden">{rail}</span>
		<span class="block">
			<span class="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
				<span
					class="text-lg font-serif text-tx transition-colors duration-150 group-hover:text-accent"
				>
					{title}
				</span>
				{org && <span class="label text-tx-3">{org}</span>}
				<span class="label text-tx-3 md:hidden">· {rail}</span>
			</span>
			<p class="mt-1 text-tx-2">{description}</p>
		</span>
	</Tag>
</li>
```

Notes for the implementer:
- The dynamic `Tag` renders `<a href="...">` for linked rows and `<div>` for static ones; passing `href={undefined}` to a `<div>` is a no-op, so no conditional is needed.
- This mirrors `EntryRow`'s grid rhythm (`md:grid-cols-[7rem_1fr]`, rail hidden below `md` and shown inline in the label row) but is deliberately denser: `py-4` (vs `py-7`) and `text-lg` (vs `text-2xl`), so 8–12 rows scan in one glance.

- [ ] **Step 2: Verify it compiles**

Run:

```bash
pnpm astro build
```

Expected: build succeeds (the component isn't imported anywhere yet, but must be syntactically valid). If you prefer, defer this check to Task 3 where the component is first used — either is fine.

- [ ] **Step 3: Commit**

```bash
git add src/components/TimelineRow.astro
git commit -m "Add TimelineRow component for About timeline"
```

---

### Task 3: `/about` page + nav link

Builds the page (lede + merged timeline) and adds "About" to the nav.

**Files:**
- Create: `src/pages/about.astro`
- Modify: `src/consts.ts` (add `About` to `NAV`)

**Interfaces:**
- Consumes: `getCollection('experience')` and `getCollection('projects', …)` (Task 1 + existing); `TimelineRow` from Task 2 (`{ rail, title, org?, description, href? }`); `span()` from `src/utils/dates.ts`.
- Produces: a route at `/about`; a reachable nav entry in both header variants.

- [ ] **Step 1: Add the nav entry**

In `src/consts.ts`, add `About` as the **first** item of `NAV` (it's the introduction, so it leads):

```ts
export const NAV = [
  { href: "/about", label: "About" },
  { href: "/projects", label: "Projects" },
  { href: "/writing", label: "Writing" },
  { href: "/art", label: "Art" },
  { href: "/contact", label: "Contact" },
] as const;
```

`Header.astro` maps `NAV` into both the desktop row and the mobile dialog, so no header edits are needed.

- [ ] **Step 2: Create the page**

Create `src/pages/about.astro`:

```astro
---
import { getCollection } from 'astro:content';
import TimelineRow from '../components/TimelineRow.astro';
import { SITE_TITLE } from '../consts';
import Base from '../layouts/Base.astro';
import { span } from '../utils/dates';

const description = 'A decade of building products, and how I got here.';

// Normalize both sources into one row shape, then sort newest-first. Anything
// still going has no end date, so `new Date()` floats it to the top — the same
// convention the projects index uses.
type Row = {
	sortKey: number;
	rail: string;
	title: string;
	org?: string;
	description: string;
	href?: string;
};

const experience = await getCollection('experience');
const projects = await getCollection('projects', (p) => !p.data.draft);

const jobRows: Row[] = experience.map((e) => ({
	sortKey: (e.data.endDate ?? new Date()).valueOf(),
	rail: span(e.data.startDate, e.data.endDate),
	title: e.data.title,
	org: e.data.org,
	description: e.data.description,
	href: e.data.url,
}));

// For ventures the project name is the title and the role is the secondary
// label; the row links to the case study.
const ventureRows: Row[] = projects.map((p) => ({
	sortKey: (p.data.endDate ?? new Date()).valueOf(),
	rail: span(p.data.startDate, p.data.endDate),
	title: p.data.title,
	org: p.data.role,
	description: p.data.description,
	href: `/projects/${p.id}/`,
}));

const rows = [...jobRows, ...ventureRows].sort((a, b) => b.sortKey - a.sortKey);
---

<Base title={`About · ${SITE_TITLE}`} description={description}>
	<div class="container max-w-3xl">
		<header class="page-head">
			<h1 class="page-title">About</h1>
		</header>

		<p class="mt-6 text-lg text-tx-2">
			I’ve spent about a decade in product, mostly at the messy 0-to-1 end —
			turning tangled operational processes into software people actually use.
			Most recently I co-founded <a
				href="/projects/impact-labs/"
				class="link-underline text-tx">Impact Labs</a
			>, an AI platform for philanthropic giving; before that I built enterprise
			products at Regalix for companies like Twilio and SAP Ariba. I’m happiest
			early, when a problem is still vague: talking to users, mapping the
			workflow, and building the first version myself.
		</p>

		<section class="mt-16 max-md:mt-12">
			<h2 class="label mb-4 text-tx-3">Timeline</h2>
			<ul>
				{
					rows.map((row) => (
						<TimelineRow
							rail={row.rail}
							title={row.title}
							org={row.org}
							description={row.description}
							href={row.href}
						/>
					))
				}
			</ul>
		</section>
	</div>
</Base>
```

Notes for the implementer:
- The lede uses smart quotes (`’`) to match the rest of the site's copy (see `index.astro`).
- `.link-underline` and `.page-head` / `.page-title` are existing `@layer components` classes in `global.css` — do not redefine them.
- Every non-draft project appears (per spec). Currently that's Impact Labs and Plotpoint.

- [ ] **Step 3: Build and type-check**

Run:

```bash
pnpm astro build
```

Expected: build succeeds. `getCollection('experience')` resolves (Task 1 synced its types), the `Row` mapping type-checks, and `/about` is emitted.

- [ ] **Step 4: Visual verification**

Start the dev server (per `CLAUDE.md`, background mode) and open `/about`:

```bash
pnpm astro dev --background
```

Confirm:
- The nav shows **About** first, in both the desktop row (≥ `md`) and the mobile hamburger menu (< `md`), and it's active-styled on `/about`.
- The timeline reads newest-first: **Plotpoint (2025) → Impact Labs (2022–2025) → Senior Product Manager (2020–2022) → Product Manager (2018–2020) → Product Designer (2016–2018)**.
- Impact Labs and Plotpoint rows link to their case studies; the three Regalix rows are static (no `url`).
- The date rail sits on the left ≥ `md` and moves inline (`· 2020–2022`) < `md`.
- Rows are visibly denser than the projects index rows.
- Light and dark themes both read cleanly (toggle in the header).

- [ ] **Step 5: Commit**

```bash
git add src/pages/about.astro src/consts.ts
git commit -m "Add About page with merged career timeline"
```

---

## Optional follow-up (not a task)

The Impact Labs résumé dates (Apr 2022 – Jan 2026) differ from the case study frontmatter (`2022-01-01` → `2025-01-01`, `status: ended`). The timeline uses the project file as source of truth. If the résumé dates are authoritative, update `src/content/projects/impact-labs.mdx` frontmatter — a one-line change, independent of this plan.

## Self-review notes

- **Spec coverage:** page structure (Task 3), naming/nav "About" (Task 3 step 1 + Global Constraints), merged data model from two sources (Task 1 + Task 3), `experience` schema (Task 1), denser row rendering (Task 2), no education/skills/PDF (nothing adds them), verification build+visual (each task) — all covered.
- **Type consistency:** `TimelineRow` props `{ rail, title, org?, description, href? }` are defined identically in Task 2 and consumed identically in Task 3. The `Row` type's fields map 1:1 onto those props.
- **No placeholders:** all copy (lede, page-head description, YAML) is final and concrete; the only "adjust to taste" item (page-head line) ships with a committed default.
