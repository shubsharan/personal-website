/*
 * Pure geometry for the "carved title" effect: turn a coverage raster of the
 * heading's glyphs into a grid mask of cells the ASCII renderer should leave
 * blank, so the animation appears to part around the actual letterforms.
 *
 * No DOM here — the alpha raster is produced by drawing the heading to an
 * offscreen canvas in the browser, but the sampling (alpha -> cell mask) is
 * plain arithmetic and lives here so it stays testable with `node --test`
 * (see ascii-carve.test.mjs).
 */

/**
 * @typedef {Object} CoverageOptions
 * @property {number} cols        Grid columns.
 * @property {number} rows        Grid rows.
 * @property {number} [threshold] Fraction of a cell's pixels that must be ink
 *                                before the cell is carved (0..1). LOW = carve
 *                                any cell the glyph touches (clean, no ASCII
 *                                under the letters); high leaves partly-covered
 *                                edge cells showing ASCII. Default 0.15.
 * @property {number} [alphaFloor] Alpha (0..255) above which a pixel counts as
 *                                ink. Low so faint antialiased edges still
 *                                carve. Default 16.
 * @property {number} [dilate]    Grow the mask by this many cells after
 *                                thresholding, to clear the antialiased fringe
 *                                so no ASCII touches the strokes. Default 0.
 */

/**
 * Sample a single-channel alpha raster (row-major, `width*height`, values
 * 0..255) into a row-major `Uint8Array(cols*rows)` where 1 marks a cell to
 * carve. Every pixel is assigned to exactly one cell, so thin strokes can't
 * slip between sample points; a cell carves when its ink coverage meets
 * `threshold`. Because it follows the rendered glyph shape, cleared cells trace
 * the letterforms and the interiors of counters (o, e, a) stay un-carved.
 *
 * @param {Uint8Array|Uint8ClampedArray|number[]} alpha
 * @param {number} width   Raster width in px.
 * @param {number} height  Raster height in px.
 * @param {CoverageOptions} options
 * @returns {Uint8Array}
 */
export function coverageMask(alpha, width, height, { cols, rows, threshold = 0.15, alphaFloor = 16, dilate = 0 }) {
	const mask = new Uint8Array(cols * rows);
	if (width <= 0 || height <= 0) return mask;

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

	for (let i = 0; i < mask.length; i++) {
		if (total[i] > 0 && covered[i] / total[i] >= threshold) mask[i] = 1;
	}

	return dilate > 0 ? dilateMask(mask, cols, rows, dilate) : mask;
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
