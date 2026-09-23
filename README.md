# Personal website

## Importing writing

Local Markdown and MDX posts and imported posts share the `writing` collection.
Add public RSS or Atom feeds to `content-sources.json` with a unique lowercase
hyphenated `id`, a `publication` label, and an HTTP(S) `feedURL`.
RSS feeds must expose `content:encoded`; Atom entries must expose `content`.
Summary-only feeds fail explicitly. Feed content is used as provided; the importer
cannot determine whether a publisher has truncated an otherwise valid body.

After publishing, open the source's `feedURL` in your browser and save the XML
outside this repository, for example as `~/Downloads/failing-loudly.xml`.
Import that saved file for its configured source:

```sh
pnpm content:sync --source failing-loudly --file ~/Downloads/failing-loudly.xml --dry-run
pnpm content:sync --source failing-loudly --file ~/Downloads/failing-loudly.xml
pnpm test
pnpm build
git diff -- src/content/writing
```

Review and commit the changed MDX files, then push through your usual Git workflow.
The importer reads RSS or Atom XML from disk and never fetches a feed. Both
`--source` and `--file` are required. It validates the selected feed before writing
any posts; malformed XML, summary-only entries, and missing files fail explicitly.
Dry runs write nothing. Importing the same file again produces no changes.
ZIP exports are not supported.

The importer matches existing canonical URLs and preserves their route names,
migrating imported `.md` files to `.mdx`. New posts go under
`src/content/writing/<source-id>/` with stable, collision-resistant filenames.
Frontmatter records the source, remote ID, and SHA-256 content hash.
Remote text, metadata, and published status replace the imported copy on every
import. Local edits to imported content are overwritten. An older saved feed can
restore older content, so use a fresh download and review the diff. Posts without a matching
remote identity or canonical URL remain locally authored and retain their drafts.

The importer preserves captions, tables, and footnote anchors and sanitizes retained
HTML. MDX components render images, tweets, YouTube, audio, and video; unsupported
embeds become links to the source. Images remain hosted remotely.
To support another block, add its sanitized matcher and replacement in
`scripts/content-converter.mjs`, then add the corresponding Astro component under
`src/components/content/` and a focused conversion fixture.
It never deletes posts absent from a feed. Edits outside the feed's current window
are not detected. To unpublish an imported post permanently, remove its source
from configuration before editing or deleting the local copy.

The **Validate site** GitHub Action runs tests and builds committed content on pull
requests and pushes to `main`. It can also be started manually. It has read-only
repository permissions and does not import content or create commits. There is no
scheduled feed polling or feed relay. If a feed is unavailable, the committed posts
remain available and can still be built and deployed. New posts appear only after
you import and publish them.

The repository currently uses **Cloudflare Workers Builds**, configured by
`wrangler.jsonc`, rather than Cloudflare Pages. Keep the Git integration connected
to `main` with `pnpm build` as the build command. No Cloudflare token is needed by
the validation workflow. Check the Cloudflare commit check for deployment status.

The production address is `https://shub.gg`. Astro uses it for local canonical
URLs, sitemap entries, and RSS links; Wrangler attaches the custom domain on
deployment. Imported posts retain their original publication's canonical URLs.

## Original starter documentation

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
