/*
 * Post-build: write brotli (`.br`) and gzip (`.gz`) siblings for every
 * compressible asset in `dist/`, so a static host can serve them with
 * `Content-Encoding` instead of compressing large files on the fly (which for
 * multi-MB assets like the ASCII frame JSON is usually a lower quality than
 * this q11 pass). The uncompressed original stays as the fallback for clients
 * that don't send `Accept-Encoding: br` / `gzip`.
 *
 * No dependencies — Node's built-in zlib does both. Run after `astro build`.
 * Hosts that serve pre-compressed files: Netlify, Cloudflare Pages, and nginx
 * with `brotli_static on;` / `gzip_static on;`. (Vercel compresses on the fly
 * and ignores these; harmless there.)
 */
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { gzipSync, brotliCompressSync, constants } from 'node:zlib';

const DIST = 'dist';
const EXT = new Set(['.html', '.js', '.mjs', '.css', '.json', '.svg', '.xml', '.txt', '.map']);
const MIN_BYTES = 1024; // below this, compression overhead isn't worth a second request

async function* walk(dir) {
	for (const entry of await readdir(dir, { withFileTypes: true })) {
		const path = join(dir, entry.name);
		if (entry.isDirectory()) yield* walk(path);
		else yield path;
	}
}

function ext(path) {
	const dot = path.lastIndexOf('.');
	return dot === -1 ? '' : path.slice(dot);
}

let files = 0;
let rawTotal = 0;
let brTotal = 0;

for await (const path of walk(DIST)) {
	if (path.endsWith('.br') || path.endsWith('.gz')) continue;
	if (!EXT.has(ext(path))) continue;

	const buf = await readFile(path);
	if (buf.length < MIN_BYTES) continue;

	const br = brotliCompressSync(buf, {
		params: {
			[constants.BROTLI_PARAM_QUALITY]: 11,
			[constants.BROTLI_PARAM_SIZE_HINT]: buf.length,
		},
	});
	const gz = gzipSync(buf, { level: 9 });

	await writeFile(`${path}.br`, br);
	await writeFile(`${path}.gz`, gz);

	files++;
	rawTotal += buf.length;
	brTotal += br.length;
}

const mb = (n) => (n / 1024 / 1024).toFixed(2);
console.log(
	`precompress: ${files} files, ${mb(rawTotal)} MB → ${mb(brTotal)} MB brotli` +
		(rawTotal ? ` (${((1 - brTotal / rawTotal) * 100).toFixed(0)}% smaller)` : ''),
);
