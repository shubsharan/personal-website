/*
 * The canvas render loop: draw one packed frame, live-mapping each cell's stored
 * brightness level onto the selected ramp (with contrast / invert / color), and
 * carve the title into it. Grouped by palette bucket so each color is one
 * fillText per row. The title is drawn last, on its own fine grid, in two passes
 * (a bg-colored outline, then the ink letters) so it reads against the moving
 * field no matter what's playing behind it.
 */
import { CHAR_W, RAMPS, SINGLE } from '../../utils/ascii-config.mjs';
import type { Frameset, SceneState, TitleMasks } from './types';

const MONO = 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace';

export type PaintInput = {
	active: Frameset;
	state: SceneState;
	/** charCode -> packed code, shared across resolutions (same pack alphabet). */
	lut: Int16Array;
	palette: string[];
	bgColor: string;
	titleColor: string;
	masks: TitleMasks;
};

export function createRenderer(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, fallback: HTMLElement) {
	let bufferW = 0;
	let bufferH = 0;
	let ready = false;

	const render = (frame: string, { active, state, lut, palette, bgColor, titleColor, masks }: PaintInput) => {
		const cssW = canvas.clientWidth;
		const cssH = canvas.clientHeight;
		if (cssW === 0 || cssH === 0) return;

		const dpr = Math.min(window.devicePixelRatio || 1, 2);
		const nextW = Math.round(cssW * dpr);
		const nextH = Math.round(cssH * dpr);
		if (nextW !== bufferW || nextH !== bufferH) {
			bufferW = nextW;
			bufferH = nextH;
			canvas.width = nextW;
			canvas.height = nextH;
			ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
			ctx.textBaseline = 'top';
		}

		const { cols, rows } = active;
		const { titleMask, titleFine } = masks;
		const ramp = RAMPS[state.ramp] ?? RAMPS.classic;
		const rampMax = ramp.length - 1;
		const { contrast, invert } = state;
		const full = state.color === 'full';
		const buckets = full ? 4 : 1;
		const single = full ? 0 : (SINGLE[state.color] ?? 0);

		const fontPx = cssW / (cols * CHAR_W);
		const lineH = cssH / rows;
		ctx.font = `${fontPx}px ${MONO}`;
		ctx.clearRect(0, 0, cssW, cssH);

		for (let y = 0; y < rows; y++) {
			const lines: string[] = new Array(buckets).fill('');
			const base = y * cols;
			for (let x = 0; x < cols; x++) {
				if (titleMask && titleMask[base + x]) {
					// Under the title: clear the coarse animation glyph.
					for (let k = 0; k < buckets; k++) lines[k] += ' ';
					continue;
				}
				const code = lut[frame.charCodeAt(base + x)];
				const color = code & 3;
				let v = (code >> 2) / 15;
				if (invert) v = 1 - v;
				v = (v - 0.5) * contrast + 0.5;
				v = v < 0 ? 0 : v > 1 ? 1 : v;
				const glyph = ramp[Math.round(v * rampMax)];
				const bucket = full ? color : 0;
				for (let k = 0; k < buckets; k++) lines[k] += k === bucket ? glyph : ' ';
			}
			for (let k = 0; k < buckets; k++) {
				if (lines[k].trim().length === 0) continue;
				ctx.fillStyle = full ? palette[k] : palette[single];
				ctx.fillText(lines[k], 0, y * lineH);
			}
		}

		// The title, on its own fine character grid so the letters stay crisp.
		if (titleFine) {
			const { solid: tSolid, outline: tOutline, cols: tCols, rows: tRows } = titleFine;
			const tLineH = cssH / tRows;
			const tFontPx = cssW / (tCols * CHAR_W);
			// Bold weight for a heavier stroke than the field's own glyphs use.
			ctx.font = `700 ${tFontPx}px ${MONO}`;
			const glyph = ramp[rampMax];

			// A background-colored outline first, so the title stays legible.
			ctx.fillStyle = bgColor || palette[0];
			for (let y = 0; y < tRows; y++) {
				let row = '';
				const b = y * tCols;
				for (let x = 0; x < tCols; x++) row += tOutline[b + x] ? glyph : ' ';
				if (row.trim().length > 0) ctx.fillText(row, 0, y * tLineH);
			}

			// Then the ink letters on top, drawn twice with a hair's offset
			// (faux-bold) for a heavier stroke.
			ctx.fillStyle = titleColor || palette[0];
			for (let y = 0; y < tRows; y++) {
				let row = '';
				const b = y * tCols;
				for (let x = 0; x < tCols; x++) row += tSolid[b + x] ? glyph : ' ';
				if (row.trim().length === 0) continue;
				ctx.fillText(row, 0, y * tLineH);
				ctx.fillText(row, tFontPx * 0.08, y * tLineH);
			}
		}

		if (!ready) {
			ready = true;
			fallback.hidden = true;
			canvas.classList.add('is-ready');
		}
	};

	return { render };
}
