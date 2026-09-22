#!/usr/bin/env node
import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
	LEVELS,
	PACK_ALPHABET,
	PALETTE_TOKENS,
	RAMP,
	rgbStreamToColorFrames,
	streamToFrames,
} from './ascii-lib.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(HERE, '..');

async function resolveFfmpeg() {
	try {
		const mod = await import('ffmpeg-static');
		if (mod.default) return mod.default;
	} catch {
	}
	return 'ffmpeg';
}

function parseArgs(argv) {
	const opts = {
		out: 'src/assets/apollo-ascii.json',
		cols: 64,
		rows: 36,
		fps: 12,
		invert: true,
		color: false,
		ss: null,
		to: null,
		crop: null,
	};
	const positional = [];
	for (let i = 0; i < argv.length; i++) {
		const arg = argv[i];
		switch (arg) {
			case '--out': opts.out = argv[++i]; break;
			case '--cols': opts.cols = Number(argv[++i]); break;
			case '--rows': opts.rows = Number(argv[++i]); break;
			case '--fps': opts.fps = Number(argv[++i]); break;
			case '--no-invert': opts.invert = false; break;
			case '--color': opts.color = true; break;
			case '--ss': opts.ss = argv[++i]; break;
			case '--to': opts.to = argv[++i]; break;
			case '--crop': opts.crop = argv[++i]; break;
			default: positional.push(arg);
		}
	}
	opts.input = positional[0];
	return opts;
}

function runFfmpeg(bin, opts) {
	const pixel = opts.color ? 'rgb24' : 'gray';
	const args = [];
	if (opts.ss) args.push('-ss', opts.ss);
	args.push('-i', opts.input);
	if (opts.to) args.push('-to', opts.to);
	const filters = [`fps=${opts.fps}`];
	if (opts.crop) filters.push(`crop=${opts.crop}`);
	filters.push(`scale=${opts.cols}:${opts.rows}:flags=area`, `format=${pixel}`);
	args.push(
		'-vf', filters.join(','),
		'-f', 'rawvideo',
		'-pix_fmt', pixel,
		'-',
	);

	return new Promise((resolvePromise, reject) => {
		const child = spawn(bin, args, { stdio: ['ignore', 'pipe', 'pipe'] });
		const chunks = [];
		let stderr = '';
		child.stdout.on('data', (c) => chunks.push(c));
		child.stderr.on('data', (c) => { stderr += c.toString(); });
		child.on('error', (err) => {
			reject(err.code === 'ENOENT'
				? new Error('ffmpeg not found on PATH. Install ffmpeg to (re)encode.')
				: err);
		});
		child.on('close', (code) => {
			if (code === 0) resolvePromise(Buffer.concat(chunks));
			else reject(new Error(`ffmpeg exited ${code}:\n${stderr.slice(-800)}`));
		});
	});
}

async function main() {
	const opts = parseArgs(process.argv.slice(2));
	if (!opts.input) {
		console.error('Usage: node scripts/ascii-encode.mjs <input.mp4> [--ss 0:38 --to 1:05 ...]');
		process.exit(1);
	}

	const mode = opts.color ? 'color' : 'mono';
	console.error(`Encoding ${opts.input} -> ${opts.cols}x${opts.rows} @ ${opts.fps}fps (${mode}) …`);
	const bin = await resolveFfmpeg();
	const raw = await runFfmpeg(bin, opts);

	const frames = opts.color
		? rgbStreamToColorFrames(raw, opts.cols, opts.rows)
		: streamToFrames(raw, opts.cols, opts.rows, { ramp: RAMP, invert: opts.invert });

	if (frames.length === 0) {
		throw new Error('ffmpeg produced no full frames — check the input path and --ss/--to.');
	}

	const payload = {
		cols: opts.cols,
		rows: opts.rows,
		fps: opts.fps,
		frames,
	};
	if (opts.color) {
		payload.palette = PALETTE_TOKENS;
		payload.pack = PACK_ALPHABET;
		payload.levels = LEVELS;
	}

	const outPath = resolve(REPO, opts.out);
	await mkdir(dirname(outPath), { recursive: true });
	await writeFile(outPath, JSON.stringify(payload));
	console.error(`Wrote ${frames.length} frames to ${opts.out}`);
}

main().catch((err) => {
	console.error(err.message);
	process.exit(1);
});
