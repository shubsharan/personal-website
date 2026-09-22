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

export function coverageMask(alpha, width, height, { cols, rows, threshold = 0.15, alphaFloor = 16, dilate = 0 }) {
	const levels = coverageLevels(alpha, width, height, { cols, rows, alphaFloor });
	const mask = new Uint8Array(levels.length);
	const cut = threshold * 255;
	for (let i = 0; i < levels.length; i++) if (levels[i] >= cut) mask[i] = 1;
	return dilate > 0 ? dilateMask(mask, cols, rows, dilate) : mask;
}

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
