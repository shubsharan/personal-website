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
- Use EB Garamond as the default/serif body font and Inter as the sans option for UI (e.g. header), both via Astro’s Google Fonts provider.

## Learned Workspace Facts

- Color system is Flexoki (https://stephango.com/flexoki) in `src/styles/global.css`, in two layers: the raw palette in `@theme` (`--color-paper`, `--color-base-600`, `--color-cyan-600`, …) and the semantic tokens in `@theme inline` (`bg`, `bg-2`, `ui`, `ui-2`, `ui-3`, `tx`, `tx-2`, `tx-3`, and accents `re or ye gr cy bl pu ma` with `-2` variants). Components should only use the semantic layer: `text-tx-2` / `border-ui` in markup, `var(--tx-2)` in hand-written CSS. `--accent` maps to `--cy` per the Flexoki UI mapping.
- Semantic tokens swap to their dark values under `@media (prefers-color-scheme: dark)` on `:root`; deleting that block is all it takes to make the site light-only.
- Tailwind v4 gotchas that already bit this repo: colors only generate utilities from `@theme`, not a plain `:root`, and unlayered element rules (e.g. `a { color }`) outrank utilities unless wrapped in `@layer base`. Never put two conflicting color utilities on one element (e.g. `text-tx-2` plus a conditional `text-tx`) — Tailwind's sort order decides the winner, not class order.
- Fonts are configured in `astro.config.mjs` with `fontProviders.google()`: EB Garamond → `--font-eb-garamond` / `--font-serif`, Inter → `--font-inter` / `--font-sans`; loaded from `BaseHead`.
- Repo remote is `https://github.com/shubsharan/personal-website.git`.
