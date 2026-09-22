import { HALO } from './config.mjs';
import type { Frameset } from './types';

export type PaletteSnapshot = {
	palette: string[];
	bgColor: string;
	titleColor: string;
	haloColor: string;
	haloFade: string;
};

function toRgb(color: string): [number, number, number] {
	const c = color.trim();
	if (c.startsWith('#')) {
		let h = c.slice(1);
		if (h.length === 3 || h.length === 4) h = h.replace(/./g, (ch) => ch + ch);
		const n = parseInt(h.slice(0, 6), 16);
		if (!Number.isNaN(n)) return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
	}
	const m = c.match(/[\d.]+/g);
	if (m && m.length >= 3) return [+m[0], +m[1], +m[2]];
	return [206, 93, 151];
}

export function createPaletteReader(title: HTMLElement | null, scope: HTMLElement) {
	return {
		read(active: Frameset): PaletteSnapshot {
			const styles = getComputedStyle(scope);
			const palette = active.palette.map((token) => styles.getPropertyValue(token).trim());
			const bgColor = styles.getPropertyValue('--bg').trim();
			const titleColor = title ? getComputedStyle(title).color : '';
			const [r, g, b] = toRgb(styles.getPropertyValue(HALO.token));
			const haloColor = `rgba(${r}, ${g}, ${b}, ${HALO.strength})`;
			const haloFade = `rgba(${r}, ${g}, ${b}, 0)`;
			return { palette, bgColor, titleColor, haloColor, haloFade };
		},
	};
}
