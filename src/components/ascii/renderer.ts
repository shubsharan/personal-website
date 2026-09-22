import { CHAR_W, FIELD_SCATTER, RAMPS, SINGLE } from './config.mjs';
import type { Frameset, SceneState, TitleLetter, TitleMasks } from './types';

const MONO = 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace';

const TONE_LOW = 0.34;
const TONE_HIGH = 0.62;
function toneBucket(lum: number): number {
	if (lum < TONE_LOW) return 0;
	if (lum < TONE_HIGH) return 2;
	return 1;
}

function hash(x: number, y: number): number {
	let h = (x * 374761393 + y * 668265263) | 0;
	h = ((h ^ (h >>> 13)) * 1274126177) | 0;
	return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

export type PaintInput = {
	active: Frameset;
	state: SceneState;
	lut: Int16Array;
	palette: string[];
	bgColor: string;
	titleColor: string;
	masks: TitleMasks;
	halo: { x: number; y: number; radius: number } | null;
	haloColor: string;
	haloFade: string;
	fieldWarp: number;
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
		const ramp = state.ramp in RAMPS ? RAMPS[state.ramp as keyof typeof RAMPS] : RAMPS.classic;
		const rampMax = ramp.length - 1;
		const { contrast, invert } = state;
		const tone = state.color === 'tone';
		const perCell = state.color === 'full' || tone;
		const buckets = perCell ? 4 : 1;
		const single = perCell ? 0 : (SINGLE[state.color] ?? 0);

		const fontPx = cssW / (cols * CHAR_W);
		const cellW = cssW / cols;
		const lineH = cssH / rows;
		ctx.font = `${fontPx}px ${MONO}`;
		ctx.clearRect(0, 0, cssW, cssH);
		const boldOffset = boldField ? fontPx * 0.045 : 0;

		const shadowAlpha = boldField ? 0.3 : 0;
		const shadowColor = palette[0] || bgColor;
		const shadowDx = fontPx * 0.09;
		const shadowDy = fontPx * 0.09;

		const scatter = fieldWarp > 0 && !!halo && halo.radius > 0;
		const infl = scatter ? halo!.radius * FIELD_SCATTER.influence : 0;
		const infl2 = infl * infl;
		const shove = scatter ? halo!.radius * FIELD_SCATTER.strength * fieldWarp : 0;
		const jitter = FIELD_SCATTER.jitter;
		const dPos: number[][] = scatter ? palette.map(() => []) : [];
		const dGlyph: string[][] = scatter ? palette.map(() => []) : [];

		for (let y = 0; y < rows; y++) {
			const lines: string[] = new Array(buckets).fill('');
			let shadowLine = '';
			const base = y * cols;
			for (let x = 0; x < cols; x++) {
				if (titleMask && titleMask[base + x]) {
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
				const bucket = perCell ? (tone ? toneBucket(lum) : color) : 0;

				if (scatter) {
					const dx = (x + 0.5) * cellW - halo!.x;
					const dy = (y + 0.5) * lineH - halo!.y;
					const d2 = dx * dx + dy * dy;
					if (d2 < infl2) {
						const d = Math.sqrt(d2) || 0.0001;
						const fall = 1 - d / infl;
						const ux = dx / d;
						const uy = dy / d;
						const mag = shove * fall * (1 + (hash(x, y) - 0.5) * jitter);
						const tan = shove * fall * (hash(x + 101, y + 53) - 0.5) * jitter;
						const idx = perCell ? bucket : single;
						dPos[idx].push(x * cellW + ux * mag - uy * tan, y * lineH + uy * mag + ux * tan);
						dGlyph[idx].push(glyph);
						for (let k = 0; k < buckets; k++) lines[k] += ' ';
						shadowLine += ' ';
						continue;
					}
				}

				for (let k = 0; k < buckets; k++) lines[k] += k === bucket ? glyph : ' ';
				shadowLine += glyph;
			}
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

		if (fine && letters && letters.length) {
			const tCellW = cssW / fine.cols;
			const tRowH = cssH / fine.rows;
			const tFontPx = cssW / (fine.cols * CHAR_W);
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
								row += ' ';
								continue;
							}
						}
						row += glyph;
					}
					if (row.trim().length === 0) continue;
					ctx.fillText(row, x, gy);
					if (ink) ctx.fillText(row, x + tFontPx * 0.08, gy);
				}
			};

			ctx.fillStyle = bgColor || palette[0];
			for (let li = 0; li < letters.length; li++) drawLetter(letters[li], false);
			ctx.fillStyle = titleColor || palette[0];
			for (let li = 0; li < letters.length; li++) drawLetter(letters[li], true);
		}

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
