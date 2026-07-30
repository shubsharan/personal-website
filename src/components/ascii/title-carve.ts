/*
 * Turns the real <h2> heading into the two grids the renderer carves it with.
 * The heading is drawn to an offscreen raster in the canvas's own pixel space and
 * sampled twice: once at the animation's coarse grid (to CLEAR the big glyphs
 * where the title sits), and once at a much finer grid of its own (to DRAW the
 * letters crisply on top). Decoupling the title from the animation resolution is
 * what makes the words legible. The pixel->cell sampling is pure and tested in
 * ascii-carve.mjs; this factory is the DOM half that produces the alpha raster.
 */
import { coverageMask, dilateMask } from '../../utils/ascii-carve.mjs';
import {
	CARVE_HALO,
	CARVE_THRESHOLD,
	CHAR_W,
	TITLE_CELL_PX,
	TITLE_FINE_FLOOR,
	TITLE_OUTLINE_RADIUS,
} from '../../utils/ascii-config.mjs';
import type { Frameset, TitleMasks } from './types';

type CarverDeps = {
	canvas: HTMLCanvasElement;
	title: HTMLElement | null;
	rasterCanvas: HTMLCanvasElement;
	rasterCtx: CanvasRenderingContext2D | null;
};

const EMPTY: TitleMasks = { titleMask: null, titleFine: null };

export function createTitleCarver({ canvas, title, rasterCanvas, rasterCtx }: CarverDeps) {
	const titleText = (title?.textContent ?? '').replace(/\s+/g, ' ').trim();

	// Draw the heading to the offscreen raster in the canvas's own pixel space and
	// return its alpha channel for per-cell coverage sampling. The phrase is wrapped
	// to the heading's width so it can grow and stay legible on narrow screens (on
	// mobile a single line would be far too small to carve). The visible title is
	// drawn from THIS raster — the DOM <h2> is hidden — so the wrapping here is the
	// source of truth for what the reader sees.
	const paintCoverage = (): { alpha: Uint8Array; W: number; H: number } | null => {
		if (!title || !rasterCtx) return null;
		const cssW = canvas.clientWidth;
		const cssH = canvas.clientHeight;
		if (!cssW || !cssH) return null;

		const cs = getComputedStyle(title);
		const fontSize = parseFloat(cs.fontSize) || 16;
		let lineHeight = parseFloat(cs.lineHeight);
		if (!lineHeight || cs.lineHeight === 'normal') lineHeight = fontSize * 1.2;
		else if (lineHeight < 4) lineHeight = fontSize * lineHeight; // unitless ratio
		const font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
		const maxWidth = title.clientWidth;
		if (!titleText || maxWidth <= 0) return null;

		const W = Math.max(1, Math.round(cssW));
		const H = Math.max(1, Math.round(cssH));
		rasterCanvas.width = W;
		rasterCanvas.height = H;
		rasterCtx.clearRect(0, 0, W, H);
		rasterCtx.font = font;
		rasterCtx.textAlign = 'center';
		rasterCtx.textBaseline = 'alphabetic';
		rasterCtx.fillStyle = '#fff';

		// Greedy word-wrap to the heading's width — matches CSS `white-space: normal`.
		const words = titleText.split(' ');
		const lines: string[] = [];
		let line = '';
		for (const word of words) {
			const next = line ? `${line} ${word}` : word;
			if (line && rasterCtx.measureText(next).width > maxWidth) {
				lines.push(line);
				line = word;
			} else {
				line = next;
			}
		}
		if (line) lines.push(line);

		// Place each baseline the way CSS does: the extra line-height is split as
		// half-leading above and below the ascent+descent. The wrapped block is
		// centered vertically in the band and each line centered horizontally,
		// mirroring the heading's centered, translate-centered layout.
		const fm = rasterCtx.measureText('Hg');
		const ascent = fm.fontBoundingBoxAscent || fontSize * 0.8;
		const descent = fm.fontBoundingBoxDescent || fontSize * 0.2;
		const halfLeading = (lineHeight - (ascent + descent)) / 2;
		const blockTop = (cssH - lines.length * lineHeight) / 2;
		for (let i = 0; i < lines.length; i++) {
			rasterCtx.fillText(lines[i], cssW / 2, blockTop + i * lineHeight + halfLeading + ascent);
		}

		const rgba = rasterCtx.getImageData(0, 0, W, H).data;
		const alpha = new Uint8Array(W * H);
		for (let i = 0; i < alpha.length; i++) alpha[i] = rgba[i * 4 + 3];
		return { alpha, W, H };
	};

	// Rebuild both masks for the current layout / resolution. Owns the <h2>'s own
	// visual state: once carved, the ASCII rendering IS the visible title, so the
	// real heading is kept for accessibility / no-JS but its glyphs are hidden.
	const rebuild = (active: Frameset): TitleMasks => {
		if (!title) return EMPTY;
		const cov = paintCoverage();
		if (!cov) {
			title.style.opacity = '';
			return EMPTY;
		}
		// Coarse mask: clear the animation's big glyphs wherever the title sits.
		const titleMask = coverageMask(cov.alpha, cov.W, cov.H, {
			cols: active.cols,
			rows: active.rows,
			threshold: CARVE_THRESHOLD,
			dilate: CARVE_HALO,
		});
		// Fine grid: the title's own high-res character grid, independent of the
		// animation, so the letters read. Derived from a small target cell size.
		const tCols = Math.max(1, Math.round(canvas.clientWidth / (TITLE_CELL_PX * CHAR_W)));
		const tRows = Math.max(1, Math.round(canvas.clientHeight / TITLE_CELL_PX));
		const solid = coverageMask(cov.alpha, cov.W, cov.H, {
			cols: tCols,
			rows: tRows,
			threshold: TITLE_FINE_FLOOR,
		});
		title.classList.add('is-carved');
		title.style.opacity = '0';
		return {
			titleMask,
			titleFine: {
				solid,
				outline: dilateMask(solid, tCols, tRows, TITLE_OUTLINE_RADIUS),
				cols: tCols,
				rows: tRows,
			},
		};
	};

	return { rebuild };
}
