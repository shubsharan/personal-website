# ASCII band: serif title carved out of the render

**Date:** 2026-07-30
**Component:** `src/components/AsciiWorkbench.astro`
**Status:** Approved design, pre-implementation

## Goal

Set the phrase **"square pegs in round holes"** as a prominent serif heading
overlaid in the middle of the ASCII video band, and have the animated ASCII part
around each letter (a tight per-glyph "carve"). The negative space is measured by
[`@chenglou/pretext`](https://github.com/chenglou/pretext), which supplies the
per-glyph geometry the canvas renderer uses to skip cells.

This replaces the current small `"Everything on the table"` caption. The phrase
becomes the title of the piece.

## Decisions (locked)

| Question | Decision |
| --- | --- |
| Text role | Overlaid inside the band, **replaces** the `"Everything on the table"` caption. Not promoted to the page's semantic `<h1>`. |
| Carve shape | **Tight per-glyph** wrap — ASCII hugs each letter's box (plus a halo). |
| Typography | **EB Garamond serif** (`--font-serif`), the site body serif. |
| Placement | **Centered**, prominent, wrapping to ~2 lines within the 64:27 band. |
| Measurement engine | **pretext measures** the real overlaid DOM text; pretext does not lay glyphs onto the canvas itself. |
| Resolution | Carve at whatever resolution the viewer selects; accept coarse-grid blockiness rather than force-bumping. |

## Scope

Changes are confined to `src/components/AsciiWorkbench.astro` plus:

- a new dependency (`@chenglou/pretext`, pinned),
- one new pure helper module + its `node --test` file (for the box→cell logic),
  following the existing `scripts/ascii-lib.mjs` / `scripts/ascii-lib.test.mjs`
  pattern.

No changes to the JSON frame data, the offline encoder, or other pages.

## Components

### a. The title element (server-rendered DOM)

A real element inside `.ascii-stage`:

```html
<div class="ascii-title" data-ascii-title>square pegs in round holes</div>
```

- Font: `--font-serif` (EB Garamond).
- Size: a prominent `clamp()`; `max-width` tuned so the phrase wraps to ~2 lines.
- Centered over the canvas (absolute, centered in the stage).
- Color: `--tx`.
- Being real text, it is screen-reader accessible and **visible without JS** — it
  is the title and must not depend on the canvas.
- Lowercase as written ("square pegs in round holes"), matching the source phrasing.

The stage keeps its existing `role="img"` + `aria-label` describing the scene.

### b. Measurement (pretext, client-side)

On each geometry-changing event, pretext measures the phrase at the title's
**exact computed font string and content-box width**, so its layout matches what
the browser painted. Output: per-line, per-glyph boxes in stage-relative CSS px.
Each box is expanded by a small **halo** (padding) so serifs never touch a live
ASCII character.

Recompute triggers:

- boot,
- `ResizeObserver` on the root (already wired in the component),
- resolution switch (coarse/default/fine changes cols/rows and the box→cell map),
- `document.fonts.ready` — EB Garamond loads asynchronously; measuring before the
  webfont is ready would misplace the carve, so we (re)measure once fonts settle.

Play/pause and dark-scheme changes do **not** trigger recompute.

### c. Knockout mask

A `Uint8Array(cols * rows)` marking every cell that intersects any haloed glyph
box. A cell `(x, y)` covers the CSS-px region
`[x·cellW, (x+1)·cellW] × [y·cellH, (y+1)·cellH]` where `cellW = cssW/cols`,
`cellH = cssH/rows`; it is masked if that region intersects any glyph box.

- Rebuilt **only** on geometry change, never per frame.
- The existing per-cell render loop gains one cheap lookup: a masked cell emits a
  space (`' '`) instead of a glyph, so the stage background shows through.

## Data flow

```
title text + computed font + content-box width
      │
      ▼  (pretext)
per-line / per-glyph boxes  ──► expand by halo
      │
      ▼  (box ↔ cell intersection — pure, testable)
Uint8Array mask (cols × rows)
      │
      ▼  (render hot loop)
masked cell → emit ' '  → background shows through → ASCII parts around letters
```

## Fallback & accessibility

- The title is always real text (accessible, indexable, visible without JS).
- Without JS / before hydration: the title overlays the static poster `<pre>` with
  a subtle CSS scrim for legibility. Once the mask is applied, the script adds an
  `is-carved` class that drops the scrim — the negative space then does the work.
- Reduced motion: the band pauses on the poster frame, but `render()` still runs
  once for the still, so the carve is applied to the static image too.

## Testing

- **Pure helper (unit-tested, `node --test`):** the box→cell intersection. Given a
  list of glyph boxes, grid dims, and cell size, assert exactly which cell indices
  are masked (including halo expansion and edge/partial-overlap cases). Mirrors the
  `scripts/ascii-lib.mjs` + `.test.mjs` split so the geometry stays testable with
  no DOM.
- **Browser-only (visual verification):** pretext measurement against the live DOM
  font, and the canvas carve at coarse/default/fine plus a resize.

## Risks

- **`@chenglou/pretext` is v0.0.8** (pre-1.0). Pin the exact version. Verify early
  that it exposes per-glyph advances; if it only returns line-level metrics, derive
  per-glyph x-positions from its cached glyph widths (still pretext-driven, no DOM
  reflow). Confirming this API is the first implementation step.
- **Grid coarseness.** At default resolution each cell is ~7–8px, so per-glyph
  carving of a serif is somewhat blocky (crisper at "Fine"). This reads as on-theme
  ASCII chunkiness; the halo keeps edges clean. Accepted, not fixed.
- **Async webfont.** If the remeasure on `document.fonts.ready` is missed, the
  carve will be offset from the painted glyphs on first paint. The fonts-ready
  remeasure is a required trigger, not an optimization.

## Out of scope

- Promoting the phrase to a semantic `<h1>`.
- Changing frame data, the offline encoder, resolution variants, or other pages.
- Per-glyph outline (as opposed to box) carving — boxes + halo only.
