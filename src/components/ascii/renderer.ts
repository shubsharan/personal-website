/*
 * The canvas render loop: draw one packed frame, live-mapping each cell's stored
 * brightness level onto the selected ramp (with contrast / invert / color), and
 * carve the title into it. Grouped by palette bucket so each color is one
 * fillText per row. The title is drawn last as individual letters — each on its
 * own fine grid, in two passes (a bg-colored outline, then the ink letters) and
 * shifted by its own physics offset — so it reads against the moving field and
 * can scatter away from the pointer. Finally, a soft magenta halo tints whatever
 * sits under the cursor.
 */
import { CHAR_W, FIELD_SCATTER, RAMPS, SINGLE } from '../../utils/ascii-config.mjs';
import type { Frameset, SceneState, TitleLetter, TitleMasks } from './types';

const MONO = 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace';

// `tone` color mode: pick the palette bucket from the cell's own scene luminance
// (0..1, computed before invert so it's stable across themes) instead of its
// baked hue — cool shadows, ink midtones, warm highlights. Palette order is
// [0 --tx, 1 --or, 2 --bl, 3 --cy]; thresholds are tuned by eye.
const TONE_LOW = 0.34;
const TONE_HIGH = 0.62;
function toneBucket(lum: number): number {
	return lum < TONE_LOW ? 2 : lum < TONE_HIGH ? 0 : 1;
}

/** Stable per-cell pseudo-random in [0,1) — so a cell always jitters the same way. */
function hash(x: number, y: number): number {
	let h = (x * 374761393 + y * 668265263) | 0;
	h = ((h ^ (h >>> 13)) * 1274126177) | 0;
	return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

export type PaintInput = {
	active: Frameset;
	state: SceneState;
	/** charCode -> packed code, shared across resolutions (same pack alphabet). */
	lut: Int16Array;
	palette: string[];
	bgColor: string;
	titleColor: string;
	masks: TitleMasks;
	/** Pointer halo in CSS px. Position persists so the effect can ease out. */
	halo: { x: number; y: number; radius: number } | null;
	haloColor: string;
	haloFade: string;
	/** Eased 0..1 intensity of the whole pointer effect (glow + field scatter). */
	fieldWarp: number;
	/** Heavier field stroke for light mode, where thin ink on paper reads faint. */
	boldField: boolean;
};

export function createRenderer(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, fallback: HTMLElement) {
	let bufferW = 0;
	let bufferH = 0;
	let ready = false;

	const render = (frame: string, input: PaintInput) => {
		const { active, state, lut, palette, bgColor, titleColor, masks, halo, haloColor, haloFade, fieldWarp, boldField } =
			input;
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
		const { titleMask, fine, letters } = masks;
		const ramp = RAMPS[state.ramp] ?? RAMPS.classic;
		const rampMax = ramp.length - 1;
		const { contrast, invert } = state;
		// `full` and `tone` both color per cell (4 buckets); the rest force one.
		const tone = state.color === 'tone';
		const perCell = state.color === 'full' || tone;
		const buckets = perCell ? 4 : 1;
		const single = perCell ? 0 : (SINGLE[state.color] ?? 0);

		const fontPx = cssW / (cols * CHAR_W);
		const cellW = cssW / cols;
		const lineH = cssH / rows;
		ctx.font = `${fontPx}px ${MONO}`;
		ctx.clearRect(0, 0, cssW, cssH);
		// Light-mode faux-bold: paint the field a second time a hair to the right,
		// for a heavier stroke than a mono font's own glyphs — enough to shake the
		// faded look on paper without the mass a full 700 weight makes.
		const boldOffset = boldField ? fontPx * 0.045 : 0;

		// Figure-ground shadow (light mode): a faint offset backing behind the field
		// so each glyph lifts off the paper instead of blending into it. Drawn per
		// row, once, under the colored passes. Off in dark mode (glyphs glow already).
		const shadowAlpha = boldField ? 0.3 : 0;
		const shadowColor = palette[0] || bgColor;
		const shadowDx = fontPx * 0.09;
		const shadowDy = fontPx * 0.09;

		// Field scatter: cells within reach of the cursor are lifted out of the
		// batched rows and drawn individually, shoved radially outward (eased by
		// `fieldWarp`, jittered per cell). Everything else stays batched per row.
		const scatter = fieldWarp > 0 && !!halo && halo.radius > 0;
		const infl = scatter ? halo!.radius * FIELD_SCATTER.influence : 0;
		const infl2 = infl * infl;
		const shove = scatter ? halo!.radius * FIELD_SCATTER.strength * fieldWarp : 0;
		const jitter = FIELD_SCATTER.jitter;
		// Displaced glyphs, grouped by palette bucket so the fill color is set once.
		const dPos: number[][] = scatter ? palette.map(() => []) : [];
		const dGlyph: string[][] = scatter ? palette.map(() => []) : [];

		for (let y = 0; y < rows; y++) {
			const lines: string[] = new Array(buckets).fill('');
			// One combined row of every batched glyph (any bucket), for the shadow.
			let shadowLine = '';
			const base = y * cols;
			for (let x = 0; x < cols; x++) {
				if (titleMask && titleMask[base + x]) {
					// Under the title: clear the coarse animation glyph.
					for (let k = 0; k < buckets; k++) lines[k] += ' ';
					shadowLine += ' ';
					continue;
				}
				const code = lut[frame.charCodeAt(base + x)];
				const color = code & 3;
				const lum = (code >> 2) / 15;
				let v = lum;
				if (invert) v = 1 - v;
				v = (v - 0.5) * contrast + 0.5;
				v = v < 0 ? 0 : v > 1 ? 1 : v;
				const glyph = ramp[Math.round(v * rampMax)];
				// In tone mode the bucket comes from luminance, not the baked hue.
				const bucket = perCell ? (tone ? toneBucket(lum) : color) : 0;

				if (scatter) {
					const dx = (x + 0.5) * cellW - halo!.x;
					const dy = (y + 0.5) * lineH - halo!.y;
					const d2 = dx * dx + dy * dy;
					if (d2 < infl2) {
						const d = Math.sqrt(d2) || 0.0001;
						const fall = 1 - d / infl; // 1 at the cursor, 0 at the edge
						const ux = dx / d;
						const uy = dy / d;
						const mag = shove * fall * (1 + (hash(x, y) - 0.5) * jitter);
						const tan = shove * fall * (hash(x + 101, y + 53) - 0.5) * jitter;
						const idx = perCell ? bucket : single;
						dPos[idx].push(x * cellW + ux * mag - uy * tan, y * lineH + uy * mag + ux * tan);
						dGlyph[idx].push(glyph);
						for (let k = 0; k < buckets; k++) lines[k] += ' ';
						shadowLine += ' '; // scattered cells move; no static shadow
						continue;
					}
				}

				for (let k = 0; k < buckets; k++) lines[k] += k === bucket ? glyph : ' ';
				shadowLine += glyph;
			}
			// Shadow first (under the colored glyphs), then the color passes on top.
			if (shadowAlpha && shadowLine.trim().length > 0) {
				ctx.save();
				ctx.globalAlpha = shadowAlpha;
				ctx.fillStyle = shadowColor;
				ctx.fillText(shadowLine, shadowDx, y * lineH + shadowDy);
				ctx.restore();
			}
			for (let k = 0; k < buckets; k++) {
				if (lines[k].trim().length === 0) continue;
				ctx.fillStyle = perCell ? palette[k] : palette[single];
				ctx.fillText(lines[k], 0, y * lineH);
				if (boldOffset) ctx.fillText(lines[k], boldOffset, y * lineH);
			}
		}

		// The scattered field cells, one fillText each but grouped by color.
		if (scatter) {
			for (let idx = 0; idx < dGlyph.length; idx++) {
				const glyphs = dGlyph[idx];
				if (glyphs.length === 0) continue;
				const pos = dPos[idx];
				ctx.fillStyle = palette[idx];
				for (let j = 0; j < glyphs.length; j++) {
					ctx.fillText(glyphs[j], pos[j * 2], pos[j * 2 + 1]);
					if (boldOffset) ctx.fillText(glyphs[j], pos[j * 2] + boldOffset, pos[j * 2 + 1]);
				}
			}
		}

		// The title, letter by letter on its own fine grid so it stays crisp. It
		// rides the SAME analytic scatter as the field: cells within reach of the
		// cursor are drawn individually and shoved out, the rest stay batched.
		if (fine && letters && letters.length) {
			const tCellW = cssW / fine.cols;
			const tRowH = cssH / fine.rows;
			const tFontPx = cssW / (fine.cols * CHAR_W);
			// Bold weight for a heavier stroke than the field's own glyphs use.
			ctx.font = `700 ${tFontPx}px ${MONO}`;
			const glyph = ramp[rampMax];

			const drawLetter = (letter: TitleLetter, ink: boolean) => {
				const mask = ink ? letter.solid : letter.outline;
				const x = letter.col * tCellW;
				for (let r = 0; r < letter.rows; r++) {
					let row = '';
					const b = r * letter.cols;
					const gy = (letter.row + r) * tRowH;
					for (let c = 0; c < letter.cols; c++) {
						if (!mask[b + c]) {
							row += ' ';
							continue;
						}
						if (scatter) {
							const gx = (letter.col + c) * tCellW;
							const dx = gx + 0.5 * tCellW - halo!.x;
							const dy = gy + 0.5 * tRowH - halo!.y;
							const d2 = dx * dx + dy * dy;
							if (d2 < infl2) {
								const d = Math.sqrt(d2) || 0.0001;
								const fall = 1 - d / infl;
								const ux = dx / d;
								const uy = dy / d;
								const gc = letter.col + c;
								const gr = letter.row + r;
								const mag = shove * fall * (1 + (hash(gc, gr) - 0.5) * jitter);
								const tan = shove * fall * (hash(gc + 101, gr + 53) - 0.5) * jitter;
								const px = gx + ux * mag - uy * tan;
								const py = gy + uy * mag + ux * tan;
								ctx.fillText(glyph, px, py);
								if (ink) ctx.fillText(glyph, px + tFontPx * 0.08, py);
								row += ' '; // lifted out of the batched run
								continue;
							}
						}
						row += glyph;
					}
					if (row.trim().length === 0) continue;
					ctx.fillText(row, x, gy);
					// Faux-bold: a second pass a hair to the right (ink only).
					if (ink) ctx.fillText(row, x + tFontPx * 0.08, gy);
				}
			};

			// All outlines first, then all ink — so a scattered cell's ink is never
			// overpainted by a neighbour's bg ring.
			ctx.fillStyle = bgColor || palette[0];
			for (let li = 0; li < letters.length; li++) drawLetter(letters[li], false);
			ctx.fillStyle = titleColor || palette[0];
			for (let li = 0; li < letters.length; li++) drawLetter(letters[li], true);
		}

		// Pointer halo: tint the ASCII already under the cursor magenta, its opacity
		// riding the same `fieldWarp` as the scatter so glow and shove fade together.
		// `source-atop` keeps it clipped to the painted glyphs (the gaps stay
		// background), so it reads as the field itself glowing, not an overlay.
		if (scatter && haloColor) {
			const grad = ctx.createRadialGradient(halo!.x, halo!.y, 0, halo!.x, halo!.y, halo!.radius);
			grad.addColorStop(0, haloColor);
			grad.addColorStop(1, haloFade);
			const prevOp = ctx.globalCompositeOperation;
			const prevAlpha = ctx.globalAlpha;
			ctx.globalCompositeOperation = 'source-atop';
			ctx.globalAlpha = fieldWarp;
			ctx.fillStyle = grad;
			ctx.fillRect(0, 0, cssW, cssH);
			ctx.globalAlpha = prevAlpha;
			ctx.globalCompositeOperation = prevOp;
		}

		if (!ready) {
			ready = true;
			fallback.hidden = true;
			canvas.classList.add('is-ready');
		}
	};

	return { render };
}
