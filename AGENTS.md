## Development

When starting the dev server, use background mode:

```
astro dev --background
```

Manage the background server with `astro dev stop`, `astro dev status`, and `astro dev logs`.

## Documentation

Full documentation: https://docs.astro.build

Consult these guides before working on related tasks:

- [Adding pages, dynamic routes, or middleware](https://docs.astro.build/en/guides/routing/)
- [Working with Astro components](https://docs.astro.build/en/basics/astro-components/)
- [Using React, Vue, Svelte, or other framework components](https://docs.astro.build/en/guides/framework-components/)
- [Adding or managing content](https://docs.astro.build/en/guides/content-collections/)
- [Adding styles or using Tailwind](https://docs.astro.build/en/guides/styling/)
- [Supporting multiple languages](https://docs.astro.build/en/guides/internationalization/)

## Learned User Preferences

- Prefer the engineered-document palette (warm graphite + ink-violet accent) for site colors; keep tokens in `src/styles/global.css` rather than putting presentation styles in `BaseHead`.
- Three fonts only, via Astro’s Google Fonts provider: IBM Plex Serif (`font-serif`) for body copy and long-form `.prose`; IBM Plex Sans (`font-sans`) for headings, nav, and the ASCII hero title; IBM Plex Mono (`font-mono`) for labels, dates, and code.
- Space siblings with parent `flex`/`grid` + `gap-*`, never with `mt-*`/`mb-*`/`space-*` or CSS margins. Nest groups when spacing is uneven. Margins are allowed only for `mx-auto` centering, `m-0` resets, and hairline offsets like `-ml-px`.
- Gap and padding use Tailwind steps on a preferred scale: multiples of 8 first (`8`, `16`, `24`), then multiples of 4 (`4`, `12`, `20`), then other even steps (`2`, `6`, `10`), then `0.5` / `1` / `1.5` / `px`. Never use odd steps (`3`, `5`, `7`, `37`, `45`, …). In hand-written CSS the same scale applies in rem (multiples of `0.5rem`, plus `0.125`/`0.25`/`0.375rem`). Size/position geometry (`size-3`, `-left-2.75`) is out of scope.
- All text (headings and body) uses the default `--tx` with no class. `text-tx-3` is only for chrome: section indexes, dates/rails, labels, meta rows, Substack note, list markers, ASCII controls. Inline links are `--accent` + underline by default (no classes). Chrome links opt out with `no-underline` and either `text-tx hover:text-accent` (nav, footer, row links, contact) or `text-tx-3 hover:text-tx` (back / “All writing” / Instagram / `[src]`).
- Keep code free of narrating comments; code should explain itself.
- Prefer Tailwind utility classes in each component over custom CSS classes or scoped `<style>` blocks. Keep `global.css` to theme tokens, `@layer base` document defaults, and `.prose` for markdown HTML that cannot carry utilities.
- Prefer standard Tailwind scale utilities (`text-sm`, `gap-1.5`, `h-3.5`, etc.) over arbitrary bracket values (`text-[…]`, `gap-[…]`) for size, spacing, and font-size in CSS/`@apply`.
- In hand-written CSS, size and space in `rem` (not `em`) on a 0.25rem grid (`0.75rem`, `1rem`, `1.25rem`, …); hairline borders and radii stay in `px`.
- Prefer self-contained CSS rule blocks (each selector carries all its own declarations, e.g. one `.prose h3` block with font-size) over splitting shared declarations into grouped-selector rules.
- Lay pages out on the Cognition-style 15-column frame (see Site shell) with standard `col-start-*` / `col-span-*` utilities; content sits flush against rails rather than padded inside them; avoid manual `w-[…]` / `max-w-[calc(…)]` width calculations.
- Prefer shared heading styles on `h1`–`h3` in `@layer base` (IBM Plex Sans, one size per level) over repeating font/size utilities on heading tags. Mono is for chrome (dates, section indexes, labels); nav and headings are sans; body copy and `.prose` are serif.
- Prefer Lucide icons via `astro-icon` for UI controls (header, theme toggle, ASCII controls).

## Learned Workspace Facts

- Color system is an engineered-document palette in `src/styles/global.css`, in two layers: the raw palette in `@theme` (`--color-paper`, `--color-ink`, `--color-accent-light`, …) and the semantic tokens in `@theme inline` (`bg`, `bg-2`, `ui`, `ui-2`, `ui-3`, `tx`, `tx-2`, `tx-3`, and accents `re or ye gr cy bl pu ma` with `-2` variants). Components should only use the semantic layer: `text-tx-3` / `border-ui` in markup, `var(--tx-3)` in hand-written CSS. `--accent` is ink-violet (`#4a3aff` light / `#9d93ff` dark); `--color-accent` exposes it to utilities. Base `a` is `text-accent underline underline-offset-4`; chrome links add `no-underline`. Headings inherit color from `body` — do not restate `text-tx` on them.
- Theme follows the OS by default via `@media (prefers-color-scheme: dark)` on `:root:not([data-theme])`; the header toggle pins an explicit choice with `data-theme` on `<html>` (persisted in localStorage, applied pre-paint by BaseHead). Nested `[data-theme='dark']` can pin a subtree (e.g. the ascii band).
- Tailwind v4 gotchas that already bit this repo: colors only generate utilities from `@theme`, not a plain `:root`, and unlayered element rules (e.g. `a { color }`) outrank utilities unless wrapped in `@layer base`. Never put two conflicting color utilities on one element (e.g. `text-tx-2` plus a conditional `text-tx`) — Tailwind's sort order decides the winner, not class order. There is no `container-md`/`container-lg` class — only `container`, composed with `max-w-*` when a fixed measure is needed.
- Fonts are configured in `astro.config.mjs` with `fontProviders.google()`: IBM Plex Sans → `--font-ibm-plex-sans` / `--font-sans` (weights include 700 for the ASCII title), IBM Plex Serif → `--font-ibm-plex-serif` / `--font-serif`, IBM Plex Mono → `--font-ibm-plex-mono` / `--font-mono`; loaded from `BaseHead`. After adding fonts, run `pnpm astro sync` so `<Font>` types regenerate.
- Site shell mirrors cognition.com’s frame (rails and columns), with spacing on the site scale: `[data-site]` is `max-w-360 px-4 md:px-16`, wrapping one zero-gap `md:grid-cols-15` grid (equal columns). Sidebar = cols 1–3, row 1 only (never `row-span-2` — the footer owns row 2 across all columns): sticky, `pt-36`, `gap-4` between logo and nav, `HeaderLink` = `text-nav` (15px/1.3) `py-px no-underline`, flush to the outer rail. Inactive links are `text-tx hover:text-accent`; the active link is `text-accent` with a 2×12px accent `before:` bar at `-left-2.75`, vertically centered. `<main>` = cols 4–15 as a nested `md:grid-cols-12`, `pt-4 md:pt-44` (content top at 16px mobile / 176px desktop), `gap-y-12` between sections, `pb-16`. `<footer>` spans all 15 columns in row 2: `-ml-px border-t pt-8 pb-24 bg-bg z-10` so it covers the rails. Rails are not borders: `Base.astro` draws 1px lines on an `-z-10` overlay grid at column starts 1, 4, 13 (content rail — one column right of where 7-col content text ends, like Cognition), 15 (full height) and 5 (section rail, `h-50` fade) — five rails, never a second right-side rail, each with a fixed 2×8px tick at the viewport top. Below `md` only the two outer rails show, as 200px stubs.
- Page sections wrap in `<Section index? span="content|wide|full">` (subgrid of main). The mono `index` sits in page column 1 (flush against the sidebar rail), top-aligned with the section's first line. `content` = cols 2–8 (7 cols, starts on the section rail), `wide` = cols 2–11 (to the outer right rail), `full` = cols 1–12. The section body is `flex flex-col gap-4 md:gap-6` — direct children get no `mt-*`; headings start the section (no top padding). Date lists (`EntryRow`/`TimelineRow`) live inside content: `ul.divide-y.border-t` rows with `sm:grid-cols-row` (date column `minmax(max-content,1fr)`, title `6fr` — i.e. 1 of 7 columns), `py-8 gap-y-2`, date `sm:pt-1.5`; below `sm` the date drops under the text. Row text stacks with `flex flex-col gap-2`.
- Type scale tokens in `@theme` (Cognition's sizes): `text-body` 15px/1.5 (body default), `text-title-sm`/`text-title` 18→20px/1.3 (base `h2`), `text-display-sm`/`text-display` 24px/1.2 → 36px/1.1 (base `h1`). Tokens carry their own letter-spacing, so don't add `tracking-*` to headings.
- UI scaffolding is Tailwind on each component: Geist Mono `text-xs tabular-nums tracking-wide` for labels/dates, an accent tick (`before:`) on the active nav item. Headings (`h1`–`h3`) get type from `@layer base` — do not restate font/size/color on them. Header mark is `/logo.svg`; icons use `astro-icon` with Lucide. Theme toggle lives in the footer; `ThemeToggle` supports multiple instances.
- Below `md`, a top bar with logo + hamburger opens a full-screen `<dialog>` of nav links. From `md` up, a sticky left sidebar holds the logo and vertical nav (Home, About, Writing, Art, Contact) with an accent tick on the active item. Theme toggle is in the footer.
- ASCII hero is the canvas full-bleed in its section, with the control bar directly below (`gap-4`). No dot-grid, crop marks, or window chrome. Keep asset-driven `aspect-[64/27]` and cqi clamp on the overlay. The title must stay carved into the ASCII field (not a plain overlay outside it) — fix legibility via font choice, not by removing the carve. On the home page it lives in `<Section span="wide">` (section rail → outer right rail); its background covers the col-13 content rail. Controls are Tailwind utilities in `AsciiControls.astro`; under `sm` the bar tightens `gap-x-2`.
- Writing entries are markdown in `src/content/writing/`; Substack imports use `<figure>`/`<figcaption>`, and posts with `canonicalURL` show a muted “originally appeared on Substack” line. Dates use compact `MM.DD.YY` via `shortDate`. `.prose` is `flex flex-col gap-4` (1rem); lists and figures use flex + gap too — no sibling margins.
- Repo remote is `https://github.com/shubsharan/personal-website.git`.
