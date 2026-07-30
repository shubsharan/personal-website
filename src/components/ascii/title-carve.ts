/*
 * Turns the real <h2> heading into the data the renderer carves it with. The
 * heading is drawn to an offscreen raster in the canvas's own pixel space and
 * sampled twice: once at the animation's coarse grid (to CLEAR the big glyphs
 * where the title sits), and once, per letter, at a much finer grid of its own
 * (to DRAW the letters crisply on top). Decoupling the title from the animation
 * resolution is what makes the words legible.
 *
 * Line-breaking is delegated to @chenglou/pretext — accurate, unicode-aware wrap
 * that matches real browser metrics — so the wrapped lines are the source of
 * truth for what the reader sees. Within each line, letters are split into their
 * own little ASCII bitmaps (positioned on a shared fine grid) so the pointer
 * scatter can displace each one independently while they still line up as one
 * word at rest. The pixel->cell sampling is pure and tested in carve.mjs;
 * this factory is the DOM half that produces the alpha raster.
 */
import { layoutWithLines, prepareWithSegments } from '@chenglou/pretext';
import { coverageMask, dilateMask } from './carve.mjs';
import {
	CARVE_HALO,
	CARVE_THRESHOLD,
	CHAR_W,
	TITLE_CELL_PX,
	TITLE_FINE_FLOOR,
	TITLE_OUTLINE_RADIUS,
} from './config.mjs';
import type { Frameset, TitleLetter, TitleMasks } from './types';

type CarverDeps = {
	canvas: HTMLCanvasElement;
	title: HTMLElement | null;
	rasterCanvas: HTMLCanvasElement;
	rasterCtx: CanvasRenderingContext2D | null;
};

const EMPTY: TitleMasks = { titleMask: null, fine: null, letters: null };

/** Split into grapheme clusters (so accents/emoji stay whole), with a fallback. */
function makeSegmenter(): (text: string) => string[] {
	if (typeof Intl !== 'undefined' && 'Segmenter' in Intl) {
		const seg = new Intl.Segmenter(undefined, { granularity: 'grapheme' });
		return (text) => Array.from(seg.segment(text), (s) => s.segment);
	}
	return (text) => Array.from(text);
}

export function createTitleCarver({ canvas, title, rasterCanvas, rasterCtx }: CarverDeps) {
	const titleText = (title?.textContent ?? '').replace(/\s+/g, ' ').trim();
	const splitGraphemes = makeSegmenter();

	// Rebuild everything for the current layout / resolution. Owns the <h2>'s own
	// visual state: once carved, the ASCII rendering IS the visible title, so the
	// real heading is kept for accessibility / no-JS but its glyphs are hidden.
	const rebuild = (active: Frameset): TitleMasks => {
		if (!title || !rasterCtx) return EMPTY;
		const cssW = canvas.clientWidth;
		const cssH = canvas.clientHeight;
		if (!cssW || !cssH) return EMPTY;

		const cs = getComputedStyle(title);
		const fontSize = parseFloat(cs.fontSize) || 16;
		let lineHeight = parseFloat(cs.lineHeight);
		if (!lineHeight || cs.lineHeight === 'normal') lineHeight = fontSize * 1.2;
		else if (lineHeight < 4) lineHeight = fontSize * lineHeight; // unitless ratio
		const font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
		const maxWidth = title.clientWidth;
		if (!titleText || maxWidth <= 0) {
			title.style.opacity = '';
			return EMPTY;
		}

		// Wrap with pretext: accurate, unicode-aware line breaking. This is the
		// layout the reader sees, so it's the source of truth for the phrasing.
		let lineTexts: string[];
		try {
			const prepared = prepareWithSegments(titleText, font, { whiteSpace: 'normal' });
			lineTexts = layoutWithLines(prepared, maxWidth, lineHeight).lines.map((l) =>
				l.text.replace(/\s+$/, ''),
			);
		} catch {
			lineTexts = [titleText];
		}
		if (lineTexts.length === 0) lineTexts = [titleText];

		const W = Math.max(1, Math.round(cssW));
		const H = Math.max(1, Math.round(cssH));
		rasterCanvas.width = W;
		rasterCanvas.height = H;
		rasterCtx.clearRect(0, 0, W, H);
		rasterCtx.font = font;
		rasterCtx.textAlign = 'left';
		rasterCtx.textBaseline = 'alphabetic';
		rasterCtx.fillStyle = '#fff';

		// Place each baseline the way CSS does: the extra line-height is split as
		// half-leading above and below the ascent+descent, the block centered in
		// the band and each line centered horizontally. Drawn left-aligned (not
		// centered) so per-letter pen positions below match the painted pixels.
		const fm = rasterCtx.measureText('Hg');
		const ascent = fm.fontBoundingBoxAscent || fontSize * 0.8;
		const descent = fm.fontBoundingBoxDescent || fontSize * 0.2;
		const halfLeading = (lineHeight - (ascent + descent)) / 2;
		const blockTop = (cssH - lineTexts.length * lineHeight) / 2;
		const lines = lineTexts.map((text, i) => {
			const left = (cssW - rasterCtx.measureText(text).width) / 2;
			const baseline = blockTop + i * lineHeight + halfLeading + ascent;
			rasterCtx.fillText(text, left, baseline);
			return { text, left, baseline };
		});

		const rgba = rasterCtx.getImageData(0, 0, W, H).data;
		const alpha = new Uint8Array(W * H);
		for (let i = 0; i < alpha.length; i++) alpha[i] = rgba[i * 4 + 3];

		// Coarse mask: clear the animation's big glyphs wherever the title sits.
		const titleMask = coverageMask(alpha, W, H, {
			cols: active.cols,
			rows: active.rows,
			threshold: CARVE_THRESHOLD,
			dilate: CARVE_HALO,
		});

		// The title's own fine grid, independent of the animation resolution.
		const tCols = Math.max(1, Math.round(cssW / (TITLE_CELL_PX * CHAR_W)));
		const tRows = Math.max(1, Math.round(cssH / TITLE_CELL_PX));
		const cellW = cssW / tCols;
		const rowH = cssH / tRows;
		const pad = TITLE_OUTLINE_RADIUS;

		const letters: TitleLetter[] = [];
		for (const line of lines) {
			const lineTop = line.baseline - ascent;
			const lineBot = line.baseline + descent;
			let prefix = '';
			for (const g of splitGraphemes(line.text)) {
				// Kerned pen positions: the letter spans the advance the prefix grows by.
				const x0 = line.left + rasterCtx.measureText(prefix).width;
				prefix += g;
				const x1 = line.left + rasterCtx.measureText(prefix).width;
				if (!g.trim()) continue; // spaces advance the pen but carry no ink

				// Tight advance box in fine cells — sampled from the raster.
				const tc0 = Math.max(0, Math.floor(x0 / cellW));
				const tc1 = Math.min(tCols, Math.ceil(x1 / cellW));
				const tr0 = Math.max(0, Math.floor(lineTop / rowH));
				const tr1 = Math.min(tRows, Math.ceil(lineBot / rowH));
				const tcW = tc1 - tc0;
				const trH = tr1 - tr0;
				if (tcW <= 0 || trH <= 0) continue;

				// Copy the letter's raster window (snapped to cell edges) and reduce it
				// to a per-cell coverage mask.
				const rx = Math.min(W - 1, Math.max(0, Math.round(tc0 * cellW)));
				const ry = Math.min(H - 1, Math.max(0, Math.round(tr0 * rowH)));
				const rw = Math.min(W - rx, Math.max(1, Math.round(tc1 * cellW) - rx));
				const rh = Math.min(H - ry, Math.max(1, Math.round(tr1 * rowH) - ry));
				const sub = new Uint8Array(rw * rh);
				for (let yy = 0; yy < rh; yy++) {
					const srcBase = (ry + yy) * W + rx;
					const dstBase = yy * rw;
					for (let xx = 0; xx < rw; xx++) sub[dstBase + xx] = alpha[srcBase + xx];
				}
				const tight = coverageMask(sub, rw, rh, { cols: tcW, rows: trH, threshold: TITLE_FINE_FLOOR });
				let inked = false;
				for (let k = 0; k < tight.length; k++) {
					if (tight[k]) {
						inked = true;
						break;
					}
				}
				if (!inked) continue;

				// Grow the box by the outline radius so the bg ring has room, and place
				// the tight glyph inside it (the padding samples no neighbor ink).
				const c0 = Math.max(0, tc0 - pad);
				const c1 = Math.min(tCols, tc1 + pad);
				const r0 = Math.max(0, tr0 - pad);
				const r1 = Math.min(tRows, tr1 + pad);
				const lc = c1 - c0;
				const lr = r1 - r0;
				const solid = new Uint8Array(lc * lr);
				const offC = tc0 - c0;
				const offR = tr0 - r0;
				for (let r = 0; r < trH; r++) {
					for (let c = 0; c < tcW; c++) {
						if (tight[r * tcW + c]) solid[(offR + r) * lc + (offC + c)] = 1;
					}
				}

				letters.push({
					solid,
					outline: dilateMask(solid, lc, lr, pad),
					cols: lc,
					rows: lr,
					col: c0,
					row: r0,
					cx: (x0 + x1) / 2,
					cy: (lineTop + lineBot) / 2,
				});
			}
		}

		if (letters.length === 0) {
			title.style.opacity = '';
			title.classList.remove('is-carved');
			return EMPTY;
		}
		title.classList.add('is-carved');
		title.style.opacity = '0';
		return { titleMask, fine: { cols: tCols, rows: tRows }, letters };
	};

	return { rebuild };
}
