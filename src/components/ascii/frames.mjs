export function buildLut(pack) {
	const lut = new Int16Array(128);
	for (let i = 0; i < pack.length; i++) lut[pack.charCodeAt(i)] = i;
	return lut;
}

function inkDensity(frame, lut) {
	let n = 0;
	for (let i = 0; i < frame.length; i++) if (lut[frame.charCodeAt(i)] >> 2 > 2) n++;
	return n;
}

export function densestFrame(frames, lut) {
	if (!frames.length) return '';
	return frames.reduce(
		(best, f) => (inkDensity(f, lut) > inkDensity(best, lut) ? f : best),
		frames[0],
	);
}

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
