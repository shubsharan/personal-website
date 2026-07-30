# ASCII Apollo 13 Homepage Header — Design

**Date:** 2026-07-29
**Status:** Approved design, pending implementation plan

## Intent

Add a small, quiet ASCII-animation panel to the homepage: the Apollo 13 "square
peg in a round hole / dump the junk on the table" scene, converted to looping
ASCII text. It sits *beside* the opening sentence as low-contrast texture —
symbolic of the excitement and adventure of building, filtered through
technology — without dominating the deliberately calm, typography-first page.

## Decisions (locked)

- **Source clip:** provided by the user (pulled locally with `yt-dlp` from
  https://www.youtube.com/watch?v=ry55--J4_VQ, segment **0:38–1:05**). The site
  never fetches or ships the mp4; only the derived ASCII text is committed.
- **Render approach:** **pre-rendered text-frame flipbook** (Approach A). The
  clip is converted offline to plain-text ASCII frames; a small script swaps
  frames in a `<pre>` at runtime. Real text, Flexoki-themeable, dark/light
  aware, reduced-motion safe. No video, no `ffmpeg`, no raster asset ships to
  visitors.
- **Prominence:** quiet texture, **beside** the opening sentence in a side
  column (stacks above the sentence on mobile). Low-contrast tones so it reads
  as companion texture, never the focal point. The existing hero sentence and
  its rise animation are untouched.
- **Loop length:** the **full 0:38–1:05 (~27s)**.
- **Grid / rate:** ~64 columns × ~36 rows at **12fps** (~330 frames). Payload
  ~750KB raw text, ~100–150KB gzipped. `fps` is the tuning knob if it ever
  feels heavy; length stays 27s.

## Copyright note

The clip is copyrighted film footage. Downloading it locally for personal
transformation is the minor part; committing the ASCII derivative to a public
site is publishing a derivative work. The ASCII transform muddies but does not
erase that. This is the site owner's decision, made explicitly; recorded here
for transparency, not as a blocker.

## Prerequisites (local, for the offline encode step only)

- `yt-dlp` — to fetch/trim the source segment (run by the user).
- `ffmpeg` — frame extraction in the encode script. **Not currently installed**
  (`ffmpeg not found` on PATH). Needed only to (re)generate the JSON asset, not
  to build or serve the site.
- Node ≥ 26 (present: v26.5.0).

## Components

### 1. Offline conversion script — `scripts/ascii-encode.mjs`

A standalone Node script (not part of the Astro build). Responsibilities:

- Input: a local video file path (the trimmed 0:38–1:05 segment) + options
  (`--cols`, `--rows`, `--fps`, `--out`).
- Uses `ffmpeg` to sample frames at the target fps and downscale to the grid
  dimensions (grayscale).
- Maps each cell's brightness to a character from the ramp
  `" .:-=+*#%@"` (dark→light), matching the `video-to-ascii` aesthetic.
- Writes `src/assets/apollo-ascii.json`.

Rationale for not using `video-to-ascii` directly: it renders to a terminal
(ANSI/color) or to a video file — neither yields the clean, themeable
plain-text frame array Approach A needs. A ~40-line extractor produces exactly
our format while preserving the same brightness-ramp look.

The script is a build-time/offline tool: run once per re-encode, its JSON
output is committed, and it is never invoked at runtime or during `astro build`.

### 2. Asset — `src/assets/apollo-ascii.json`

```json
{
  "cols": 64,
  "rows": 36,
  "fps": 12,
  "frames": ["<row0>\n<row1>\n…", "…"]
}
```

Each frame is a single newline-joined string of `rows` lines × `cols` chars.

### 3. Component — `src/components/AsciiScene.astro`

Self-contained: `<pre>` element + scoped `<style>` + inline `<script>`.

- Imports the JSON asset, renders `frames[0]` as the initial (SSR) content so
  something shows before JS and when JS is disabled.
- Inline script drives a `requestAnimationFrame` loop that swaps the `<pre>`
  text content on the 12fps cadence and loops seamlessly.
- Styling: mono font, small size, `color: var(--tx-3)` on `var(--bg)`,
  `line-height` tuned so the character grid reads as an image. Sizing via
  `clamp()`/`ch` units so the fixed grid scales without breaking columns.
- `aria-hidden="true"` — decorative; screen readers skip the character noise.
- Honors `@media (prefers-reduced-motion: reduce)`: script does not start the
  loop; the static `frames[0]` (a strong, representative frame) remains.

### 4. Homepage integration — `src/pages/index.astro`

- Wrap the existing hero block and a new `<AsciiScene />` in a CSS grid:
  two columns on `md+` (sentence left, ASCII right), single column on mobile
  with the ASCII stacked **above** the sentence as a short block.
- No changes to the sentence markup, the project/writing collections logic, or
  the existing `.rise` animation. Purely additive layout wrapper + one import.

## Data flow

```
[user] yt-dlp → local clip.mp4 (0:38–1:05)
   │  (offline, manual)
   ▼
scripts/ascii-encode.mjs  (ffmpeg + brightness ramp)
   │  (offline, run once per re-encode)
   ▼
src/assets/apollo-ascii.json   ── committed ──►  imported by
                                                 AsciiScene.astro
                                                    │
                                                    ▼
                                        <pre> rAF flipbook @12fps
                                        (frames[0] as SSR/no-JS/reduced-motion state)
```

## Error handling & edge cases

- **JS disabled / pre-hydration:** `frames[0]` is server-rendered, so a static
  ASCII frame always shows.
- **`prefers-reduced-motion`:** no animation; static `frames[0]`.
- **Empty/malformed JSON:** component guards for an empty `frames` array and
  renders nothing (the grid column simply collapses) rather than throwing.
- **Dark/light:** color comes from semantic tokens (`--tx-3`, `--bg`), so it
  swaps with the existing theme with no extra work.
- **Missing `ffmpeg`:** only affects (re)running the encode script; surfaced as
  a clear error from the script, never at site build/serve time.

## Testing / verification

- Run `scripts/ascii-encode.mjs` against a short sample clip; confirm valid JSON
  with expected `cols`/`rows`/`fps` and non-empty frames.
- `astro dev` → homepage shows the animating panel beside the sentence on
  desktop, stacked above on mobile; sentence stays fully legible.
- Toggle OS dark/light → ASCII tones follow the theme.
- Enable "reduce motion" → animation stops on a static frame.
- Disable JS → static frame still renders.

## Out of scope

- Any runtime video/canvas processing in the browser.
- Color/ANSI ASCII (kept monochrome, semantic-token driven).
- Reuse of the panel on pages other than the homepage.
- Automating the yt-dlp download inside the repo/build.
