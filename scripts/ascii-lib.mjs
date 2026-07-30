/*
 * Pure ASCII-mapping helpers, shared by the ffmpeg encoder and the procedural
 * placeholder generator. No I/O here so the logic stays testable with plain
 * `node --test`.
 */

/** Brightness ramp, sparse -> dense. Index 0 is "empty", last is "solid". */
export const RAMP = ' .:-=+*#%@';

/**
 * Map one 0..255 grayscale byte to a ramp character.
 *
 * `invert` controls polarity. The site renders dark characters on a light
 * background, so a *dark* source pixel (low byte) should become a *dense*
 * character to look like ink. That's the default (invert = true).
 */
export function byteToChar(byte, { ramp = RAMP, invert = true } = {}) {
	const v = invert ? 255 - byte : byte;
	const idx = Math.round((v / 255) * (ramp.length - 1));
	return ramp[idx];
}

/**
 * Turn a raw grayscale frame (cols*rows bytes, row-major) into a single
 * newline-joined ASCII string.
 */
export function frameToText(bytes, cols, rows, opts = {}) {
	const lines = new Array(rows);
	for (let y = 0; y < rows; y++) {
		let line = '';
		const base = y * cols;
		for (let x = 0; x < cols; x++) {
			line += byteToChar(bytes[base + x], opts);
		}
		lines[y] = line;
	}
	return lines.join('\n');
}

/**
 * Split a concatenated raw-grayscale stream into per-frame ASCII strings.
 * Any trailing partial frame (short read) is ignored.
 */
export function streamToFrames(buffer, cols, rows, opts = {}) {
	const frameSize = cols * rows;
	const count = Math.floor(buffer.length / frameSize);
	const frames = new Array(count);
	for (let i = 0; i < count; i++) {
		const slice = buffer.subarray(i * frameSize, (i + 1) * frameSize);
		frames[i] = frameToText(slice, cols, rows, opts);
	}
	return frames;
}

/* ---- Color path: brightness level + Flexoki palette bucket per cell ----- *
 *
 * Rather than bake a glyph, we store a quantized brightness LEVEL (0..15, one
 * hex char) plus a palette bucket index into PALETTE_TOKENS:
 *   0 = --tx (default ink), 1 = --or (warm), 2 = --bl, 3 = --cy.
 * Storing the level (not a glyph) is what lets the settings bar re-map the
 * ASCII ramp, contrast, and invert live in the browser without the source
 * video. Polarity is bright -> dense: dark pixels become level 0 and drop out.
 * Only reasonably saturated, not-too-bright cells earn an accent.
 */

/** CSS custom properties the palette indices map to, in order. */
export const PALETTE_TOKENS = ['--tx', '--or', '--bl', '--cy'];

/** Quantization levels for the stored brightness. */
export const LEVELS = 16;

/*
 * Each cell packs into ONE character: code = level(0..15) * 4 + color(0..3),
 * 0..63, indexed into this alphabet. Halves the payload vs storing level and
 * color separately, and gzips better. The renderer decodes with the same
 * alphabet: level = code >> 2, color = code & 3.
 */
export const PACK_ALPHABET =
	'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

/**
 * Map one RGB triple to `[level, color]` numbers: level 0..15 (brightness,
 * bright -> high) and color 0..3 (palette bucket into PALETTE_TOKENS).
 */
export function cellFromRgb(r, g, b) {
	const luminance = r * 0.2126 + g * 0.7152 + b * 0.0722;
	const normalized = Math.max(0, Math.min(1, (luminance - 20) / 210));
	const level = Math.round(normalized * (LEVELS - 1));

	const rn = r / 255;
	const gn = g / 255;
	const bn = b / 255;
	const max = Math.max(rn, gn, bn);
	const min = Math.min(rn, gn, bn);
	const range = max - min;
	const saturation = max === 0 ? 0 : range / max;

	let color = 0;
	if (saturation > 0.24 && normalized < 0.82 && range > 0) {
		let hue;
		if (max === rn) hue = ((gn - bn) / range) % 6;
		else if (max === gn) hue = (bn - rn) / range + 2;
		else hue = (rn - gn) / range + 4;
		hue = (hue * 60 + 360) % 360;

		if (hue < 65 || hue >= 330) color = 1; // warm -> --or
		else if (hue >= 165 && hue < 270) color = 2; // blue -> --bl
		else if (hue >= 65 && hue < 165) color = 3; // green/cyan -> --cy
	}

	return [level, color];
}

/**
 * Split a raw rgb24 stream (cols*rows*3 bytes per frame) into packed frames.
 * Each frame is one string of length cols*rows, row-major (index = y*cols + x),
 * each char encoding level*4 + color via PACK_ALPHABET.
 */
export function rgbStreamToColorFrames(buffer, cols, rows) {
	const cells = cols * rows;
	const frameSize = cells * 3;
	const count = Math.floor(buffer.length / frameSize);
	const frames = new Array(count);
	for (let f = 0; f < count; f++) {
		const base = f * frameSize;
		let s = '';
		for (let i = 0; i < cells; i++) {
			const p = base + i * 3;
			const [level, color] = cellFromRgb(buffer[p], buffer[p + 1], buffer[p + 2]);
			s += PACK_ALPHABET[level * 4 + color];
		}
		frames[f] = s;
	}
	return frames;
}
