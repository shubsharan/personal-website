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

- Prefer the full Flexoki color palette for site colors; keep tokens in `src/styles/global.css` rather than putting presentation styles in `BaseHead`.
- Use EB Garamond as the default/serif body font, Inter as the sans option for UI chrome, and Mr Dafoe (`font-logo`) for the header wordmark (“shub”), all via Astro’s Google Fonts provider.
- Prefer Tailwind utility classes in components over scoped `<style>` blocks; consolidate component styling into Tailwind when feasible.
- Prefer `container max-w-3xl` for page content and header/footer inner content; keep header/footer bars full-bleed with borders on the outer element; avoid manual `w-[…]` width calculations.
- Prefer shared base/prose heading styles over repeating per-component Tailwind heading size utilities.
- Prefer Lucide icons via `astro-icon` for UI controls (header, theme toggle, ASCII controls).

## Learned Workspace Facts

- Color system is Flexoki (https://stephango.com/flexoki) in `src/styles/global.css`, in two layers: the raw palette in `@theme` (`--color-paper`, `--color-base-600`, `--color-cyan-600`, …) and the semantic tokens in `@theme inline` (`bg`, `bg-2`, `ui`, `ui-2`, `ui-3`, `tx`, `tx-2`, `tx-3`, and accents `re or ye gr cy bl pu ma` with `-2` variants). Components should only use the semantic layer: `text-tx-2` / `border-ui` in markup, `var(--tx-2)` in hand-written CSS. `--accent` maps to `--cy` per the Flexoki UI mapping.
- Theme follows the OS by default via `@media (prefers-color-scheme: dark)` on `:root:not([data-theme])`; the header toggle pins an explicit choice with `data-theme` on `<html>` (persisted in localStorage, applied pre-paint by BaseHead). Nested `[data-theme='dark']` can pin a subtree (e.g. the ascii band).
- Tailwind v4 gotchas that already bit this repo: colors only generate utilities from `@theme`, not a plain `:root`, and unlayered element rules (e.g. `a { color }`) outrank utilities unless wrapped in `@layer base`. Never put two conflicting color utilities on one element (e.g. `text-tx-2` plus a conditional `text-tx`) — Tailwind's sort order decides the winner, not class order. There is no `container-md`/`container-lg` class — only `container`, composed with `max-w-*` when a fixed measure is needed.
- Fonts are configured in `astro.config.mjs` with `fontProviders.google()`: EB Garamond → `--font-eb-garamond` / `--font-serif`, Inter → `--font-inter` / `--font-sans`, Mr Dafoe → `--font-mr-dafoe` / `--font-logo` (logo uses `display: 'block'` to avoid FOUT); loaded from `BaseHead`. After adding fonts, run `pnpm astro sync` so `<Font>` types regenerate.
- Site content width is Tailwind `container` in `global.css` (breakpoint-stepping max-widths, centered, `1.5rem` horizontal padding) plus `max-w-3xl` on content/chrome; header and footer are full-bleed with the border on the outer element. Body is a column flex with `main { flex: 1 }` so the footer stays at the bottom on short pages.
- UI chrome (nav, status labels, dates, footer) uses the `.label` class (Inter, small, tracked, uppercase). Header mark is `/logo.svg` with a `font-logo` “shub” wordmark; icons use `astro-icon` with Lucide. Theme toggle is a segmented sun/moon switch sized from the icon.
- Writing entries are markdown in `src/content/writing/`; Substack imports use `<figure>`/`<figcaption>`, and posts with `canonicalURL` show a muted “originally appeared on Substack” line.
- Repo remote is `https://github.com/shubsharan/personal-website.git`.
