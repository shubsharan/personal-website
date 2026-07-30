# Astro Starter Kit: Blog

```sh
pnpm create astro@latest -- --template blog
```

> 🧑‍🚀 **Seasoned astronaut?** Delete this file. Have fun!

Features:

- ✅ Minimal styling (make it your own!)
- ✅ 100/100 Lighthouse performance
- ✅ SEO-friendly with canonical URLs and Open Graph data
- ✅ Sitemap support
- ✅ RSS Feed support
- ✅ Markdown & MDX support

## 🚀 Project Structure

Inside of your Astro project, you'll see the following folders and files:

```text
├── public/
├── src/
│   ├── assets/
│   ├── components/
│   ├── content/
│   ├── layouts/
│   └── pages/
├── astro.config.mjs
├── README.md
├── package.json
└── tsconfig.json
```

Astro looks for `.astro` or `.md` files in the `src/pages/` directory. Each page is exposed as a route based on its file name.

There's nothing special about `src/components/`, but that's where we like to put any Astro/React/Vue/Svelte/Preact components.

The `src/content/` directory contains "collections" of related Markdown and MDX documents. This site has two: `src/content/projects/` and `src/content/writing/`. Their frontmatter schemas live in `src/content.config.ts`. See [Astro's Content Collections docs](https://docs.astro.build/en/guides/content-collections/) to learn more.

Any static assets, like images, can be placed in the `public/` directory.

## 🧞 Commands

All commands are run from the root of the project, from a terminal:

| Command                   | Action                                           |
| :------------------------ | :----------------------------------------------- |
| `pnpm install`             | Installs dependencies                            |
| `pnpm dev`             | Starts local dev server at `localhost:4321`      |
| `pnpm build`           | Build your production site to `./dist/`          |
| `pnpm preview`         | Preview your build locally, before deploying     |
| `pnpm astro ...`       | Run CLI commands like `astro add`, `astro check` |
| `pnpm astro -- --help` | Get help using the Astro CLI                     |

## 🗜️ Deploying (pre-compressed assets)

`pnpm build` runs `scripts/precompress.mjs` after `astro build`, writing `.br`
(brotli, quality 11) and `.gz` siblings for every compressible file in `dist/`.
This matters most for the ASCII header's frame JSON (`src/assets/apollo-ascii*.json`):
the `fine` variant is 4.5 MB raw but ~788 KB brotli, and it's fetched at runtime
as a standalone asset (not inlined into the JS bundle), so the poster shows first
and the frames stream in behind it.

For the win to reach visitors, the host must serve the pre-compressed files with
`Content-Encoding` when the browser sends `Accept-Encoding: br` / `gzip`:

- **Netlify, Cloudflare Pages** — serve `.br`/`.gz` siblings automatically.
- **nginx** — enable `brotli_static on;` (ngx_brotli) and/or `gzip_static on;`.
- **Vercel** — compresses responses on the fly and ignores the siblings; still fine,
  though its on-the-fly brotli for large files may be a lower quality than q11.

The uncompressed originals remain as the fallback for clients that don't advertise
`br`/`gzip`, so nothing breaks on hosts that ignore the siblings.

## 👀 Want to learn more?

Check out [our documentation](https://docs.astro.build) or jump into our [Discord server](https://astro.build/chat).

## Credit

This theme is based off of the lovely [Bear Blog](https://github.com/HermanMartinus/bearblog/).
