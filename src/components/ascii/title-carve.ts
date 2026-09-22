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

function canvasFont(cs: CSSStyleDeclaration): string {
	const family = cs.fontFamily.split(',')[0]?.trim() || 'monospace';
	return `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${family}`;
}

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

	const rebuild = (active: Frameset): TitleMasks => {
		if (!title || !rasterCtx) return EMPTY;
		const cssW = canvas.clientWidth;
		const cssH = canvas.clientHeight;
		if (!cssW || !cssH) return EMPTY;

		const cs = getComputedStyle(title);
		const fontSize = parseFloat(cs.fontSize) || 16;
		let lineHeight = parseFloat(cs.lineHeight);
		if (!lineHeight || cs.lineHeight === 'normal') lineHeight = fontSize * 1.2;
		else if (lineHeight < 4) lineHeight = fontSize * lineHeight;
		const font = canvasFont(cs);
		const maxWidth = title.clientWidth;
		if (!titleText || maxWidth <= 0) {
			title.style.opacity = '';
			return EMPTY;
		}

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

		const titleMask = coverageMask(alpha, W, H, {
			cols: active.cols,
			rows: active.rows,
			threshold: CARVE_THRESHOLD,
			dilate: CARVE_HALO,
		});

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
				const x0 = line.left + rasterCtx.measureText(prefix).width;
				prefix += g;
				const x1 = line.left + rasterCtx.measureText(prefix).width;
				if (!g.trim()) continue;

				const tc0 = Math.max(0, Math.floor(x0 / cellW));
				const tc1 = Math.min(tCols, Math.ceil(x1 / cellW));
				const tr0 = Math.max(0, Math.floor(lineTop / rowH));
				const tr1 = Math.min(tRows, Math.ceil(lineBot / rowH));
				const tcW = tc1 - tc0;
				const trH = tr1 - tr0;
				if (tcW <= 0 || trH <= 0) continue;

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
