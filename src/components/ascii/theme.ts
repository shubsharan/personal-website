/*
 * The site's effective color theme. Mirrors the CSS precedence in global.css: a
 * manual `data-theme` on <html> (set by the header toggle) wins over the OS
 * `prefers-color-scheme`. The canvas keys its invert and accent choices off this
 * so the band follows the toggle, not just the media query — otherwise the two
 * desync whenever the OS preference and the toggle disagree.
 */
export function isDarkTheme(): boolean {
	const attr = document.documentElement.dataset.theme;
	if (attr === 'dark') return true;
	if (attr === 'light') return false;
	return window.matchMedia('(prefers-color-scheme: dark)').matches;
}
