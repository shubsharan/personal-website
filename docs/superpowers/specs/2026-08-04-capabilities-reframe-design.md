# Capabilities reframe — design

**Date:** 2026-08-04
**Status:** Approved, ready for implementation plan

## Problem

The site's spine is timeline/status. The homepage headline narrates "Right now
that's X… Before that, Y" and falls back to "Between projects at the moment."
Projects carry a status ledger (`active` / `shipped` / `ended`) drawn as
live/solid/hollow dots, and every project row and detail header leads with a
date span. The framing centers *when* things happened and *whether they
survived* ("including the ones that ended").

The goal is to reframe the site around **abilities and capabilities** — what
Shub can do — rather than a chronology of what shipped, ended, or failed.
Projects stay as the core unit but become *evidence of capability*, not a
status report.

## Decisions (from brainstorming)

- Keep projects as the core content unit; reframe their presentation.
- Homepage leads with a present-tense **capabilities statement**, independent of
  any current project. Projects appear below as examples.
- Remove the status system entirely (`active`/`shipped`/`ended`, the dots).
- Project rows lead with **role**, plus an optional **capability tag list**.
- Dates may remain but are **demoted** — never the primary field.
- Case-study prose (which mentions years) is untouched — that's the author's voice.

## Changes by file

### 1. Data model — `src/content.config.ts`

In the `projects` schema:

- **Remove** `status: z.enum(["active", "shipped", "ended"])`.
- **Make optional** `startDate` (currently required) → `z.coerce.date().optional()`.
  `endDate` stays optional.
- **Add** `capabilities: z.array(z.string()).optional()` — short capability tags
  shown on rows and the detail header.
- Keep `role`, `url`, `description`, `title`, `draft`.

### 2. `src/consts.ts`

- **Remove** the `PROJECT_STATUS` ledger entirely.

### 3. `src/components/StatusMark.astro`

- **Delete** the file. It is only used for project status; writing rows never
  pass a status. (Confirm no other importers before deleting.)

### 4. `src/components/EntryRow.astro`

Currently: `[7rem_1fr]` grid — left rail (rail text) + block (label, optional
status dot, title, description).

- **Remove** the `status` prop and the `StatusMark` render.
- Keep `rail` / `label` generic so the **writing** rows are unchanged (rail =
  month/year, label = publication).
- For **projects**, the caller passes `rail = role` and `label` = a short
  section word if needed (or omitted). Capability tags and the demoted date are
  handled by two new optional props:

  Add optional `tags?: string[]` and `meta?: string` props.
  - `tags` render as a muted `·`-separated or spaced inline list under/next to
    the label, using existing muted token (`text-tx-3`) and `.label` styling.
  - `meta` renders the demoted date, small and muted (`text-tx-3`), visually
    subordinate to title/description.
  - Writing rows pass neither, so their appearance does not change.

### 5. Homepage — `src/pages/index.astro`

- **Remove** the `active` / `past` split and the `joiner` helper (no longer
  needed for projects narrative).
- **Replace** the temporal middle paragraph with the capabilities statement:

  > I design and build products end‑to‑end — from the first sketch to the thing
  > in someone's hands. I've founded companies and shipped apps, and I can carry
  > a product across design, engineering, and story.

  (Author-editable copy; this is the approved starting draft.)

- Keep the top line ("I'm Shub. I make things.") and the writing/paint line.
- **Add a "Selected work" section** below the intro (mirroring the existing
  "Latest writing" section): list projects as `EntryRow`s with
  `rail = role`, `tags = capabilities`, `meta = demoted date span`, linking to
  each case study, with an "All projects →" link. Show up to 3.
- Projects sort by recency under the hood (`startDate` desc, undated last) — a
  sensible default, not a headline.

### 6. Projects index — `src/pages/projects/index.astro`

- **Replace** description `"Everything I've started, including the ones that
  ended."` with a capability-framed line, e.g. `"Things I've designed and
  built."` (author-editable).
- **Remove** the `"{n} total · {m} active"` meta line (depends on status).
- Update the sort to tolerate optional dates (undated sorts last; no
  `new Date()` "now" trick tied to active status).
- Rows: `rail = role`, `tags = capabilities`, `meta = demoted date span`, no
  status.

### 7. Project detail — `src/pages/projects/[...slug].astro` + `src/layouts/Entry.astro`

`Entry.astro` header currently renders a `label` (status) + `StatusMark` on the
left and `rail` (date span) on the right, then title, then `subtitle` (role).

- **Remove** the `status` prop and `StatusMark` from `Entry.astro`.
- Reframe the header meta line: lead with **role** and **capability tags**;
  move the date to a demoted/muted position (small, secondary). Keep the `url`
  link.
- Update `[...slug].astro` to stop passing `status` / `PROJECT_STATUS[...]` and
  instead pass `role` + `capabilities` + a demoted date string. The "Related
  writing" section is unchanged.

### 8. Seed capability tags (author-editable)

Add `capabilities:` to each existing project's frontmatter as a starting point:

- `impact-labs.mdx` — `["Product design", "0→1", "Data modeling"]`
- `plotpoint.mdx` — `["Product design", "Full-stack", "0→1"]`

Also remove the now-invalid `status:` line from both files' frontmatter.

## Non-goals

- No change to writing rows, the writing index, art, or the ASCII band.
- No change to case-study prose (year mentions stay).
- No new manual ordering field — recency sort is the default; can revisit later.
- `SITE_DESCRIPTION` ("founder and builder…") stays as-is for now.

## Verification

- `pnpm astro check` / `pnpm build` passes (schema change ripples through all
  callers; TypeScript catches stale `status` references).
- Homepage: no timeline narrative, capabilities statement present, "Selected
  work" lists projects.
- `/projects` and each detail page: no status dots, role + tags lead, dates
  present but visually demoted.
- Grep confirms no remaining references to `PROJECT_STATUS`, `StatusMark`, or
  `status` in project code paths.
