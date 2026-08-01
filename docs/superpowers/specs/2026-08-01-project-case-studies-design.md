# Project Case Studies — Design

**Date:** 2026-08-01
**Status:** Approved, ready for implementation planning
**Author:** Shubhankar Sharan (with Claude)

## Goal

Turn the `projects` section from placeholders into a small portfolio of **deep,
designed, interactive case studies**. The first two are **Plotpoint** and
**Impact Labs**. Each case study talks about the concept, the critical decisions,
and what made the project interesting — and embeds **live, interactive component
examples** rebuilt from the real product.

## Intent & scope decisions

These were settled during brainstorming and constrain everything below:

- **Feel:** a portfolio of case studies. The index is a lobby; the value lives
  inside each page. Impact Labs + Plotpoint are the first two of maybe 4–6 ever.
- **Component examples are live and interactive** — real vanilla-Astro islands,
  clickable in the page. Not screenshots, not static mockups.
- **No source to copy from.** Components are rebuilt fresh from memory and the
  Failing Loudly newsletter. "We need to put effort into this."
- **Content is freeform.** No shared section template or repeated headings —
  each case study is shaped by its own story. The scaffolding must *support*
  arbitrary prose with breakout components, never *enforce* structure.
- **Canvas:** breakout blocks. Prose stays narrow and readable (~65ch); an
  interactive showcase can break wider (up to full-bleed) when it needs to.
- **Framing is not prescribed.** The four framings explored (bordered card,
  phone chrome, floating breakout, inset well) are all potentially useful. We do
  **not** pick one globally — framing is chosen per-component when we build it.
- **Interactivity mechanism: vanilla Astro islands.** No UI framework. State and
  behavior live in `<script>` blocks, exactly like the existing ASCII scene
  (`animator.ts`, `controls.ts`). Zero new dependencies. This matches the repo's
  established character and the user's stated preferences.
- **Writing entries can be attached to a project.** A case study auto-collects
  the writing that belongs to it (Plotpoint already has the seven Failing Loudly
  posts; future projects will have their own). The relation lives on the writing
  side and is surfaced as a "Related writing" list on the case-study page.

## Architecture overview

Three chunks, all vanilla Astro + Tailwind + Flexoki semantic tokens:

1. **Scaffolding** — a breakout-capable case-study canvas + a small set of MDX
   wrapper primitives. Built once, shared by every case study.
2. **Plotpoint** — freeform MDX prose + the *Password Gauntlet* interactive.
3. **Impact Labs** — freeform MDX prose + the *Four-Axis Impact Profile*
   interactive (and an optional *Dollar Receipt*).

Project entries convert from `.md` to `.mdx` so they can import components. The
projects index, the `Entry` header/footer, the status system
(`active`/`shipped`/`ended`), and the date rails are **unchanged**.

### Isolation & boundaries

- **Breakout is a CSS-only change to the `prose` container.** `Entry.astro` is
  not modified, so `writing` and `art` (which also render through `Entry`) are
  unaffected. The prose column becomes a CSS grid with a centered reading track
  and a wider breakout track; only children that opt in (via `<Breakout>`) span
  wider.
- **Wrapper primitives** live in `src/components/case-study/` and are pure
  presentation — they know nothing about any specific project.
- **Each interactive** is a self-contained island: one `.astro` component owning
  its own markup, styling (Tailwind/Flexoki), and `<script>` state. It can be
  understood, tested, and embedded independently. Project-specific interactives
  live alongside their content or in a clearly-named subfolder.

## Chunk 1 — Scaffolding

### Breakout mechanism

Upgrade the shared `prose` container to a CSS grid:

- A centered **reading column** at the current comfortable measure (~65ch).
- A wider **breakout track** (and full-bleed edges) available to opted-in
  children.
- Default: every child sits in the reading column, so existing prose is
  visually identical.
- Implemented in `global.css` (the `.prose` layer), consistent with the repo's
  preference for composable classes over per-component styles.

### Wrapper primitives (`src/components/case-study/`)

Built as needed, not all up front:

- **`<Breakout>`** — width escape hatch. Prop: `size` = `normal | wide | full`.
- **`<Figure>`** — caption + optional small label; the `Fig. —` treatment.
  Uses the `.label` class (Inter, small, tracked, uppercase) already in the repo.
- **`<Frame>`** — optional presentation shell. Prop: `variant` =
  `card | phone | float | well`. This is where the four explored framings live,
  selected per-component instead of globally.

### Schema

- **`projects` collection: no changes.** Freeform content needs no new
  frontmatter. If a specific project later wants a tech-tag row or a hero image,
  add the optional field then — not speculatively (YAGNI).
- **`writing` collection: add optional `project`.** A `reference('projects')`
  (falling back to a plain slug string if the reference API is fiddly) that
  attaches a post to a project. Optional, so unrelated writing is unaffected.

### Writing ↔ project relation

- Each writing entry may set `project: <project-slug>` in frontmatter.
- The project page (`src/pages/projects/[...slug].astro`) queries the `writing`
  collection for entries whose `project` matches the current slug, sorts them
  (newest first), and renders a **"Related writing"** block after the freeform
  content and before the footer. Reuse the existing `EntryRow` component so it
  matches the writing index visually.
- `Entry.astro` gains an optional named slot (e.g. `related`) for this block, so
  the mechanism is opt-in and `writing`/`art` pages are unaffected.
- **Backfill:** set `project: plotpoint` on the seven Failing Loudly posts (all
  `src/content/writing/*.md` except `coming-soon.md`, which is a draft intro).
  The `coming-soon` post stays unattached.
- The relation is one-directional in data (writing → project) but surfaced on
  both sides: the case study lists its writing; each post keeps rendering
  normally on its own.

## Chunk 2 — Plotpoint case study

- **Frontmatter:** `status: shipped`, `role: 'Founder & engineer'`,
  `startDate`/`endDate` within 2025, `url` if there's a live link.
- **Concept framing (user's words):** *using technology to encourage physical
  connection with your community* — the phone app whose whole point is to get you
  off your phone and into the park with friends.
- **Freeform prose** covering, in whatever order reads best:
  - Origin: it grew out of the fake company built to propose to Malak (already
    public in the newsletter — usable as the emotional hook).
  - Building it fast for an Outside Lands launch (Aug 8, 2025).
  - Tone/humor as a deliberate design principle.
  - *The Touring Test* — the launched story (field debuggers for Kempelen Labs;
    MIRA, the AI popstar; 5 levels; NFC server nodes around the park).
- **Hero interactive — the Password Gauntlet.** A faithful, playable rebuild of
  the escalating-validation level: requirements that stack absurdly (length →
  Outside Lands trivia → arithmetic → a chess puzzle), culminating in the endless
  unhinged Terms & Conditions scroll. Vanilla TS state machine; Flexoki-styled;
  embedded in a `phone` or `float` frame. Self-contained and genuinely fun.

## Chunk 3 — Impact Labs case study

- **Frontmatter:** `status: ended`, `role: 'Co-founder'` (built with Sreekar),
  `startDate` 2022, `endDate` 2025.
- **Concept framing:** *an index fund for philanthropy* — curated,
  continuously-rebalanced baskets ("funds") of nonprofit programs, scored by a
  research-backed impact model, sold to donors as a monthly subscription with
  reporting.
- **Freeform prose** built around the three philosophical stakes:
  - **Nuance over a single number.** Programs are scored 1–5 on four axes —
    **depth, breadth, evidence, timeline** of impact — via a weighted model
    grounded in academic papers, analyst review, and interviews with nonprofit
    leaders. The four axes are *never* collapsed into one headline number; the
    point was to enable more nuanced conversations: what kind of impact, and for
    whom.
  - **Outcomes, not overhead.** Impact is mapped from *total revenue* to *total
    outcomes* — rejecting the poverty-mindset overhead myth. Nonprofits get the
    benefit of the doubt; how they spend doesn't matter, only what they produce.
  - **Funds that adapt to context.** The weighted model evolves as the real-world
    context of a cause shifts (a climate fund tilting short-term during a
    wildfire; refugee funds re-targeting as politics change), so the basket is
    always the most effective mix per cause per region.
  - The **LLM-powered reporting pipeline**: ingest each org's content stream
    (RSS, newsletters, social, annual reports), parse/summarize/analyze it
    through the lens of each fund, and feed monthly reports that show donors
    where money went, predicted vs. actual outcomes, and how each fund is
    improving.
  - **Optional closing reflection** on why it ended — entirely the user's call,
    written last or omitted. Not a required beat.
- **Hero interactive — the Four-Axis Impact Profile.** The depth/breadth/
  evidence/timeline model made tangible: pick a program (or a whole fund) and see
  its 1–5 profile with the reasoning behind each axis. Deliberately refuses to
  collapse to one number — the interaction *is* the thesis.
- **Optional second interactive — the Dollar Receipt.** `$X → predicted
  real-world outcomes`. Designed-in but built only if the first interactive earns
  it. YAGNI until then.

## Build sequence

Each step is independently shippable; the projects page is never left broken.

1. **Scaffolding** + convert project entries to `.mdx` (prove breakout with a
   placeholder body) + the writing↔project relation (schema field, `Related
   writing` block, backfill the Plotpoint posts).
2. **Plotpoint** prose + Password Gauntlet — the first real vertical slice,
   validating the whole pattern end-to-end.
3. **Impact Labs** prose + Four-Axis Impact Profile.
4. **Optional:** Dollar Receipt; Plotpoint/Impact Labs closing reflections.

## Out of scope (for now)

- Any UI framework (React/Preact/Svelte).
- New `projects`-collection frontmatter fields, hero images, tech-tag rows. (The
  one schema change in scope is the optional `project` field on `writing`.)
- A global/prescribed component framing.
- The Dollar Receipt and the Impact Labs closing reflection are optional, not
  committed.
- Case studies beyond Plotpoint and Impact Labs.

## Open questions to resolve during implementation

- **Plotpoint concept framing wording** — the user should own the exact phrasing;
  §Chunk 2 has the intent.
- **Password Gauntlet scope** — which of the real validation steps to include for
  the best self-contained bit (all four vs. a representative subset).
- **Impact Profile data** — one representative program/fund with plausible axis
  scores and reasoning, since there's no live data source.
- **Frame variant per interactive** — decided when each component is built, not
  now.
