/*
 * Resolves the Flexoki palette (and background / title colors) from CSS custom
 * properties at render time, so the canvas follows the site's light/dark theme
 * and any color class on the heading. DOM-bound; re-read on theme change.
 */
import { isDarkTheme } from './theme';
import type { Frameset } from './types';

export type PaletteSnapshot = {
	/** The frameset's palette tokens resolved to concrete colors, in bucket order. */
	palette: string[];
	bgColor: string;
	titleColor: string;
};

// In light mode the warm/cool buckets are thin ink on paper, where the standard
// accents read as faded; the band uses darker, higher-contrast shades instead
// (defined in global.css). Light mode ONLY — dark mode reads well on black, and
// these tokens are undefined there so the map falls through to the token itself.
const BAND_ACCENT: Record<string, string> = { '--or': '--ascii-or', '--bl': '--ascii-bl' };

export function createPaletteReader(title: HTMLElement | null) {
	return {
		read(active: Frameset): PaletteSnapshot {
			const styles = getComputedStyle(document.documentElement);
			const lightMode = !isDarkTheme();
			const palette = active.palette.map(
				(token) =>
					styles.getPropertyValue((lightMode && BAND_ACCENT[token]) || token).trim() ||
					styles.getPropertyValue(token).trim(),
			);
			const bgColor = styles.getPropertyValue('--bg').trim();
			// Read the heading's own resolved color rather than a hardcoded variable,
			// so whatever color class is on the <h2> is the single source of truth for
			// both the no-JS fallback and the canvas-rendered title.
			const titleColor = title ? getComputedStyle(title).color : '';
			return { palette, bgColor, titleColor };
		},
	};
}
