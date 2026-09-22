# Personal website

## Automatic writing sync

Local Markdown and MDX posts and imported posts share the `writing` collection.
Add public RSS or Atom feeds to `content-sources.json` with a unique lowercase
hyphenated `id`, a `publication` label, and an HTTP(S) `feedURL`.
RSS feeds must expose `content:encoded`; Atom entries must expose `content`.
Summary-only feeds fail explicitly. Feed content is used as provided; the importer
cannot determine whether a publisher has truncated an otherwise valid body.

```sh
pnpm content:sync --dry-run
pnpm content:sync
pnpm test:content
```

The importer matches existing canonical URLs and preserves their route names,
migrating imported `.md` files to `.mdx`. New posts go under
`src/content/writing/<source-id>/` with stable, collision-resistant filenames.
Frontmatter records the source, remote ID, and SHA-256 content hash.
Remote text, metadata, and published status replace the imported copy on every
change. Local edits to imported content are overwritten. Posts without a matching
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

The **Sync external posts** GitHub Action runs at minute 17 each hour and can be
started manually from Actions. It validates all feeds before writing any content,
runs the sync tests, builds changed content, and commits only changed post files
to `main`. The connected Cloudflare Git integration builds and deploys that commit.
Normal site builds do not fetch feeds. Unchanged sync runs skip build, commit, and
deployment. Failed runs report errors and leave the published site unchanged;
the next scheduled run retries. Concurrent pushes fail safely without force-pushes.

Substack challenges direct requests from GitHub-hosted runners. The workflow
therefore sets `CONTENT_FEED_BASE_URL=https://shub.gg/api/feeds` and fetches through
a small endpoint on the existing Cloudflare Worker. This endpoint serves only
the public feeds registered in `content-sources.json`; it cannot fetch arbitrary
URLs. Deploy source configuration changes before syncing a newly added source.
Local sync commands fetch feeds directly unless that environment variable is set.
Upstream errors and non-XML responses fail the sync instead of replacing posts.

The repository currently uses **Cloudflare Workers Builds**, configured by
`wrangler.jsonc`, rather than Cloudflare Pages. Keep the Git integration connected
to `main` with `pnpm build` as the build command. GitHub Actions requires
`contents: write` permission and permission to push to `main`. No Cloudflare token
is needed by the sync workflow. Review the Actions run summary for sync counts and
the Cloudflare commit check for deployment status.

The production address is `https://shub.gg`. Astro uses it for local canonical
URLs, sitemap entries, and RSS links; Wrangler attaches the custom domain on
deployment. Imported posts retain their original publication's canonical URLs.

GitHub schedules are best effort and can be delayed. For public repositories,
GitHub disables scheduled workflows after 60 days without repository activity.
Re-enable the workflow in Actions if this occurs; no-change checks do not create
keepalive commits. See [GitHub's schedule documentation](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#schedule).

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
