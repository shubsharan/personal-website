/*
 * Resolves the Flexoki palette (and background / title colors) from CSS custom
 * properties at render time. Read from an element *inside* the band, which is
 * pinned to the dark palette via data-theme="dark" — so the band stays a dark
 * panel regardless of the site theme. DOM-bound; re-read on resize / detail.
 */
import { HALO } from './config.mjs';
import type { Frameset } from './types';

export type PaletteSnapshot = {
	/** The frameset's palette tokens resolved to concrete colors, in bucket order. */
	palette: string[];
	bgColor: string;
	titleColor: string;
	/** The pointer halo's tint at full strength, and the same hue at zero alpha. */
	haloColor: string;
	haloFade: string;
};

/** Parse a resolved CSS color (hex or rgb/rgba) to [r,g,b]; magenta-400 fallback. */
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
			// Read from inside the band so the pinned dark tokens win over the site theme.
			const styles = getComputedStyle(scope);
			const palette = active.palette.map((token) => styles.getPropertyValue(token).trim());
			const bgColor = styles.getPropertyValue('--bg').trim();
			// Read the heading's own resolved color rather than a hardcoded variable,
			// so whatever color class is on the <h2> is the single source of truth for
			// both the no-JS fallback and the canvas-rendered title.
			const titleColor = title ? getComputedStyle(title).color : '';
			// The halo borrows a Flexoki accent (magenta). Resolve it to rgb so the
			// renderer can build a same-hue gradient that fades to transparent —
			// fading to the `transparent` keyword instead would muddy toward black.
			const [r, g, b] = toRgb(styles.getPropertyValue(HALO.token));
			const haloColor = `rgba(${r}, ${g}, ${b}, ${HALO.strength})`;
			const haloFade = `rgba(${r}, ${g}, ${b}, 0)`;
			return { palette, bgColor, titleColor, haloColor, haloFade };
		},
	};
}
