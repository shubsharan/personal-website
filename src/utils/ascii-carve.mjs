/*
 * Pure geometry for the "carved title" effect: turn a coverage raster of the
 * heading's glyphs into per-cell data the ASCII renderer uses to either blank
 * those cells or paint them as ASCII letters, so the words read as part of the
 * same field the animation lives in.
 *
 * No DOM here — the alpha raster is produced by drawing the heading to an
 * offscreen canvas in the browser, but the sampling (alpha -> cells) is plain
 * arithmetic and lives here so it stays testable with `node --test`
 * (see ascii-carve.test.mjs).
 */

/**
 * Reduce a single-channel alpha raster (row-major, `width*height`, values
 * 0..255) to a per-cell coverage grid: a row-major `Uint8Array(cols*rows)`
 * where each entry is 0..255 = the fraction of that cell's pixels that are ink.
 * Every pixel is assigned to exactly one cell, so thin strokes can't slip
 * between sample points.
 *
 * @param {Uint8Array|Uint8ClampedArray|number[]} alpha
 * @param {number} width
 * @param {number} height
 * @param {{ cols: number, rows: number, alphaFloor?: number }} options
 *   `alphaFloor`: alpha above which a pixel counts as ink (default 16).
 * @returns {Uint8Array}
 */
export function coverageLevels(alpha, width, height, { cols, rows, alphaFloor = 16 }) {
	const out = new Uint8Array(cols * rows);
	if (width <= 0 || height <= 0) return out;

	const covered = new Int32Array(cols * rows);
	const total = new Int32Array(cols * rows);
	const cellW = width / cols;
	const cellH = height / rows;

	for (let y = 0; y < height; y++) {
		const cy = Math.min(rows - 1, Math.floor(y / cellH));
		const rowBase = y * width;
		const cellRow = cy * cols;
		for (let x = 0; x < width; x++) {
			const idx = cellRow + Math.min(cols - 1, Math.floor(x / cellW));
			total[idx]++;
			if (alpha[rowBase + x] > alphaFloor) covered[idx]++;
		}
	}

	for (let i = 0; i < out.length; i++) {
		if (total[i] > 0) out[i] = Math.round((covered[i] / total[i]) * 255);
	}
	return out;
}

/**
 * @typedef {Object} CoverageOptions
 * @property {number} cols
 * @property {number} rows
 * @property {number} [threshold]  Coverage fraction (0..1) a cell needs to be
 *                                 carved. LOW = carve any cell the glyph
 *                                 touches. Default 0.15.
 * @property {number} [alphaFloor] Alpha above which a pixel counts as ink.
 * @property {number} [dilate]     Grow the mask by this many cells afterward,
 *                                 to clear the antialiased fringe. Default 0.
 */

/**
 * Boolean carve mask: 1 where a cell should be left blank. Thin wrapper over
 * {@link coverageLevels} plus a threshold and optional dilation.
 *
 * @param {Uint8Array|Uint8ClampedArray|number[]} alpha
 * @param {number} width
 * @param {number} height
 * @param {CoverageOptions} options
 * @returns {Uint8Array}
 */
export function coverageMask(alpha, width, height, { cols, rows, threshold = 0.15, alphaFloor = 16, dilate = 0 }) {
	const levels = coverageLevels(alpha, width, height, { cols, rows, alphaFloor });
	const mask = new Uint8Array(levels.length);
	const cut = threshold * 255;
	for (let i = 0; i < levels.length; i++) if (levels[i] >= cut) mask[i] = 1;
	return dilate > 0 ? dilateMask(mask, cols, rows, dilate) : mask;
}

/**
 * Separable box blur of a grid of 0..255 values, clamped at the edges. Used to
 * turn the title's per-cell coverage into a soft "glow" that fades outward, so
 * the field can be dimmed around the letters for contrast.
 *
 * @param {Uint8Array|number[]} src   Row-major grid, length cols*rows.
 * @param {number} cols
 * @param {number} rows
 * @param {number} radius             Blur radius in cells.
 * @returns {Uint8Array}
 */
export function boxBlur(src, cols, rows, radius) {
	if (radius <= 0) return Uint8Array.from(src);
	const tmp = new Float32Array(src.length);
	const out = new Uint8Array(src.length);

	for (let y = 0; y < rows; y++) {
		const rowBase = y * cols;
		for (let x = 0; x < cols; x++) {
			let sum = 0;
			let n = 0;
			for (let dx = -radius; dx <= radius; dx++) {
				const nx = x + dx;
				if (nx < 0 || nx >= cols) continue;
				sum += src[rowBase + nx];
				n++;
			}
			tmp[rowBase + x] = sum / n;
		}
	}

	for (let x = 0; x < cols; x++) {
		for (let y = 0; y < rows; y++) {
			let sum = 0;
			let n = 0;
			for (let dy = -radius; dy <= radius; dy++) {
				const ny = y + dy;
				if (ny < 0 || ny >= rows) continue;
				sum += tmp[ny * cols + x];
				n++;
			}
			out[y * cols + x] = Math.round(sum / n);
		}
	}

	return out;
}

/**
 * Grow a cell mask outward by `radius` cells (Chebyshev / square neighbourhood).
 * @param {Uint8Array} mask
 * @param {number} cols
 * @param {number} rows
 * @param {number} radius
 * @returns {Uint8Array}
 */
export function dilateMask(mask, cols, rows, radius) {
	const out = new Uint8Array(mask.length);
	for (let cy = 0; cy < rows; cy++) {
		for (let cx = 0; cx < cols; cx++) {
			if (!mask[cy * cols + cx]) continue;
			const y0 = Math.max(0, cy - radius);
			const y1 = Math.min(rows - 1, cy + radius);
			const x0 = Math.max(0, cx - radius);
			const x1 = Math.min(cols - 1, cx + radius);
			for (let ny = y0; ny <= y1; ny++) {
				for (let nx = x0; nx <= x1; nx++) out[ny * cols + nx] = 1;
			}
		}
	}
	return out;
}
