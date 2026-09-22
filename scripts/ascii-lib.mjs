export const RAMP = ' .:-=+*#%@';

export function byteToChar(byte, { ramp = RAMP, invert = true } = {}) {
	const v = invert ? 255 - byte : byte;
	const idx = Math.round((v / 255) * (ramp.length - 1));
	return ramp[idx];
}

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

export const PALETTE_TOKENS = ['--tx', '--or', '--bl', '--cy'];

export const LEVELS = 16;

export const PACK_ALPHABET =
	'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

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

		if (hue < 65 || hue >= 330) color = 1;
		else if (hue >= 165 && hue < 270) color = 2;
		else if (hue >= 65 && hue < 165) color = 3;
	}

	return [level, color];
}

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
