/*
 * Pure frame math for the packed ASCII framesets. No DOM and no asset imports,
 * so it stays testable with `node --test` (see ascii-frames.test.mjs) and can be
 * imported from BOTH the Astro frontmatter (Node) and the client bundle.
 *
 * Each cell of a frame is ONE packed char: code = level(0..15) * 4 + color(0..3),
 * indexed into the frameset's `pack` alphabet. The renderer decodes with
 * `level = code >> 2`, `color = code & 3`. These helpers only ever need the
 * level, so they build a charCode -> code lookup table once and reuse it.
 */

/**
 * Build a charCode -> packed code lookup table for a `pack` alphabet. Indexing
 * by `str.charCodeAt(i)` in the hot loop is far cheaper than `pack.indexOf(ch)`.
 *
 * @param {string} pack  The frameset's 64-char pack alphabet.
 * @returns {Int16Array}  Length 128; unused slots are 0 (level 0, color 0).
 */
export function buildLut(pack) {
	const lut = new Int16Array(128);
	for (let i = 0; i < pack.length; i++) lut[pack.charCodeAt(i)] = i;
	return lut;
}

/**
 * Count the cells in a packed frame brighter than level 2 — a cheap proxy for
 * how much "ink" a frame carries.
 *
 * @param {string} frame  Packed frame string, length cols*rows.
 * @param {Int16Array} lut  From {@link buildLut}.
 * @returns {number}
 */
function inkDensity(frame, lut) {
	let n = 0;
	for (let i = 0; i < frame.length; i++) if (lut[frame.charCodeAt(i)] >> 2 > 2) n++;
	return n;
}

/**
 * The densest frame in a set — the one with the most bright cells. Used for the
 * no-JS poster still and the first painted frame. Ties keep the earlier frame.
 *
 * @param {string[]} frames
 * @param {Int16Array} lut  From {@link buildLut}.
 * @returns {string}  The densest frame, or '' if `frames` is empty.
 */
export function densestFrame(frames, lut) {
	if (!frames.length) return '';
	return frames.reduce(
		(best, f) => (inkDensity(f, lut) > inkDensity(best, lut) ? f : best),
		frames[0],
	);
}

/**
 * Render a packed frame to plain ASCII text by mapping each cell's brightness
 * level (0..15) onto `ramp`. Used for the static poster (no-JS / reduced-motion).
 *
 * @param {string} frame  Packed frame string, length cols*rows.
 * @param {{ cols: number, rows: number, lut: Int16Array, ramp: string }} options
 * @returns {string}  Newline-joined rows, or '' if `frame` is falsy.
 */
export function posterText(frame, { cols, rows, lut, ramp }) {
	if (!frame) return '';
	const rampMax = ramp.length - 1;
	const lines = new Array(rows);
	for (let y = 0; y < rows; y++) {
		let line = '';
		const base = y * cols;
		for (let x = 0; x < cols; x++) {
			const level = lut[frame.charCodeAt(base + x)] >> 2;
			line += ramp[Math.round((level / 15) * rampMax)];
		}
		lines[y] = line;
	}
	return lines.join('\n');
}
