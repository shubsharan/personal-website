# About page — design

**Date:** 2026-08-05
**Status:** Approved (design), pending implementation plan

## Purpose

Add an `/about` page that does two jobs at once:

- **A — hiring artifact.** A recruiter, hiring manager, or collaborator vetting Shub can scan it in ~20 seconds for "who is this, what has he done, can I trust him."
- **B — credibility layer.** A curious site visitor gets the compact arc of Shub's background, in the same voice as the rest of the site.

These pull in different directions: A wants scannable, dated, conventional; B wants prose, voice-consistent. The design resolves this by pairing a short prose lede (B) with a scannable reverse-chronological timeline (A) on one page.

Out of scope: a downloadable/printable PDF. The deliverable is an on-site page only. (If a PDF is ever wanted, it's a later, separate piece of work.)

## Background / constraints

The career material is a **mix**: some employed roles at companies, plus independent/founder work. The founder work already exists on the site as project case studies and should **not** be re-explained on the About page — the timeline links out to it.

Two relevant facts about the existing codebase:

- The `projects` collection already carries `role`, `startDate`, `endDate`, `status`, and `url` (see `src/content.config.ts`). Founder ventures therefore already have every field a timeline row needs.
- Employed jobs are represented **nowhere** yet — no collection or data file holds them.

The site's conventions (from `CLAUDE.md` and existing code) must be followed: semantic Flexoki tokens only, Tailwind utilities over scoped `<style>`, standard Tailwind scale utilities over arbitrary bracket values, `container max-w-3xl` for page content, shared `@layer components` classes for repeated patterns, EB Garamond serif body.

## Chosen approach

**Narrative lede + compact merged timeline** (recommended option #1 of three considered; the classic résumé-sections and pure-narrative-essay alternatives were rejected — the first reads as a template and clashes with the site's deliberate voice, the second fails the recruiter scan for purpose A).

## Page structure

Route: `src/pages/about.astro`, rendered in the `Base` layout, `container max-w-3xl`, following the `page-head` / `page-title` pattern already used by `src/pages/projects/index.astro`.

Top to bottom:

1. **Page head** — `page-title` "About" plus a one-line `text-tx-2` description, matching the projects/writing index pattern.
2. **Prose lede** — 2–4 sentences in the homepage voice (the arc). Authored content, supplied by Shub. This is layer B, and on an "About" page it carries a bit more weight — it's the first thing the page is "about."
3. **Timeline** — one reverse-chronological list merging employed roles and founder ventures. This is layer A.

Naming: labeled **"About"** in the header nav and page title. (Chosen over "CV"/"Résumé"/"Background": "About" is the most personal-site-native home for an intro-plus-background page, gets clicked by recruiters and curious visitors alike, and fits the site's voice — "CV"/"Résumé" read as a downloadable document, which this isn't. The scannable timeline inside still serves the hiring purpose A regardless of the softer label.)

## Data model

The timeline is built by **merging two sources** and sorting by date descending, mirroring how `src/pages/index.astro` already pulls from collections:

### Source 1 — founder/independent work (existing `projects` collection)

Pulled automatically via `getCollection('projects', p => !p.data.draft)`. No new data entry. Each project row links to its case study at `/projects/<id>/`. This keeps the About timeline in sync with projects automatically and avoids duplicating venture dates.

Decision — **which projects appear on the timeline:** include all non-draft projects. Rationale: the projects index already shows "everything I've started, including the ones that ended," and the About timeline is the same career surface. If filtering is ever wanted (e.g. hide a minor project from the timeline), add an optional `timeline: z.boolean().default(true)` flag to the projects schema later — not in scope now.

### Source 2 — employed jobs (new `experience` data collection)

A single typed data file loaded with Astro's `file()` loader — **not** a folder of markdown, because these entries are one-liners with no case-study body.

- Location: `src/content/experience.yaml` (or `.json` — YAML preferred for hand-editing).
- Registered in `src/content.config.ts` as a new collection using `file()` loader.
- Schema (Zod):
  - `title: z.string()` — role/title, e.g. "Product Designer".
  - `org: z.string()` — company/organization.
  - `startDate: z.coerce.date()`.
  - `endDate: z.coerce.date().optional()` — omit while current.
  - `description: z.string()` — one line.
  - `url: z.string().url().optional()` — external link (company, or a page about the work).

Adding a job = one entry in this file. Adding a venture = already present the moment the project publishes.

### Merge & sort

In `about.astro`, normalize both sources into a common shape (rail date span, title, org/label, one-line description, optional href) and sort by end date descending, with still-current entries (no `endDate`) sorting to the top — the same "active floats to top" logic `projects/index.astro` uses. Reuse `span()` from `src/utils/dates.ts` for the date rail.

## Rendering

A **denser variant of the existing `EntryRow`** — not `EntryRow` itself. The projects-index row is deliberately spacious (serif `text-2xl` title, `py-7`), which is right for browsing but works against a recruiter scanning 8–12 rows in one glance.

- Add a compact row as a shared `@layer components` class (e.g. `.timeline-row`) in `src/styles/global.css`, OR a small `TimelineRow.astro` component — implementation plan to pick whichever keeps the markup cleanest, following the "composable `@layer components` for repeated patterns" preference.
- Row anatomy: **date rail · title — org · one-line description**, same grid rhythm as `EntryRow` (`md:grid-cols-[7rem_1fr]`, rail hidden below `md` and shown inline in the label row) but tighter vertical padding and a smaller title size for scan density.
- Rows with an href (project case study, or an employed role's `url`) link out; rows without stay static.
- Same visual language throughout: semantic Flexoki tokens (`text-tx`, `text-tx-2`, `text-tx-3`, `border-ui`), `group-hover:text-accent` on the title, EB Garamond.

## Navigation

Add an "About" link to the header nav (`src/components/header/Header.astro`), placed consistently with the existing links, and present in both the `md`+ inline nav and the below-`md` full-screen menu dialog.

## Content Shub must supply (after spec approval)

- The prose lede (2–4 sentences).
- The employed job history for `experience.yaml`: for each — title, org, start/end dates, one line, optional url.
- The page-head description line.

## Testing / verification

This is a static Astro content page; verification is build + visual, consistent with the rest of the site (no test framework in the repo):

- `pnpm astro sync` after adding the collection, then a successful build.
- Visually confirm: merged timeline sorts correctly (current-first), project rows link to case studies, employed rows link out where a `url` exists, layout holds at `md` and below `md`, and light/dark themes both read well.
- Confirm the nav link appears and is active-styled on `/about` in both the inline nav and the mobile menu.

## Files touched

- `src/pages/about.astro` — new page.
- `src/content/experience.yaml` — new data file.
- `src/content.config.ts` — register `experience` collection.
- `src/styles/global.css` — `.timeline-row` component class (if the class route is chosen over a component).
- `src/components/TimelineRow.astro` — new component (if chosen over the class route).
- `src/components/header/Header.astro` — add About nav link.
