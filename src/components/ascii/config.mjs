/*
 * Single source of truth for the ASCII scene's tunable settings — the ramps,
 * colors, resolutions, speeds, contrasts, and their initial values. Pure data
 * with no DOM and no asset imports, so it is imported by BOTH the presentational
 * markup in AsciiControls.astro AND the client-side wiring in AsciiFrame's
 * script. Because both read the SAME lists, the toolbar's highlighted control
 * and the renderer's actual state can never drift apart. ascii-config.test.mjs
 * enforces the cross-references (e.g. every ramp shown has a real ramp behind it).
 */

/** Width of a monospace cell as a fraction of its height. Sizes the canvas font. */
export const CHAR_W = 0.6;

/* ---- Carved-title geometry (see carve.mjs for the sampling) --------- */
export const TITLE_CELL_PX = 3; // fine title cell size (px); smaller = crisper letters
export const TITLE_FINE_FLOOR = 0.5; // fraction of a fine cell that must be ink (0..1)
export const CARVE_THRESHOLD = 0.9; // coverage a coarse cell needs before the field clears
export const CARVE_HALO = 0.2; // cells the coarse clearing grows by, so no glyph touches the title
export const TITLE_OUTLINE_RADIUS = 2; // bg-colored ring drawn around the letters, in fine cells

/*
 * Style ramps, dark -> dense. Storage is a brightness LEVEL (not a baked glyph),
 * so the renderer maps that level onto whichever ramp is selected, live.
 */
export const RAMPS = {
	classic: ' .:-=+*#%@',
	dots: ' .·•●',
	round: ' .oO@',
	dense: ' .:-=+*abcdnuvoxIJCLQ0OZ#MW&8%B@$',
};

/** Ramp used to render the no-JS poster still (same as `classic`). */
export const POSTER_RAMP = RAMPS.classic;

/*
 * Ramp toggles, in display order, each with a curated sample glyph string shown
 * in the toolbar. `key` must exist in RAMPS (enforced by the test).
 */
export const RAMP_ORDER = [
	{ key: 'dense', label: 'Dense', sample: '*8@$' },
	{ key: 'classic', label: 'Classic', sample: '.:+#' },
	{ key: 'dots', label: 'Dots', sample: '.·•●' },
	{ key: 'round', label: 'Round', sample: '.oO@' },
];

/*
 * Color modes, in display order. `full` uses each cell's own palette bucket;
 * the rest force a single bucket. `dot` is the swatch's fill — a COMPLETE literal
 * Tailwind class (never interpolated, so Tailwind's scanner sees it).
 */
export const COLORS = [
	// `tone` colors each cell by its own brightness (cool shadows -> warm
	// highlights) rather than its baked hue; the swatch previews that ramp. Default.
	{ key: 'tone', label: 'Tone', dot: 'before:bg-[linear-gradient(var(--bl),var(--tx),var(--or))]' },
	{ key: 'full', label: 'Color', dot: 'before:bg-[conic-gradient(var(--or),var(--cy),var(--bl),var(--or))]' },
	// `ink` forces the single default-ink bucket — black on paper / white on black.
	{ key: 'ink', label: 'BW', dot: 'before:bg-tx' },
];

/*
 * Single-color mode -> palette index. `full` and `tone` color per cell, so they
 * are excluded; the remaining single-bucket modes line up with the frameset's
 * palette order (['--tx','--or','--bl','--cy']). Currently just `ink` -> 0.
 */
export const PER_CELL_COLORS = ['full', 'tone'];
export const SINGLE = Object.fromEntries(
	COLORS.filter((c) => !PER_CELL_COLORS.includes(c.key)).map((c, i) => [c.key, i]),
);

/*
 * Pre-baked resolution variants, coarse -> fine. Keys/labels only — the JSON
 * loaders live in the client bundle (components/ascii/framesets.ts), since they
 * use Vite's dynamic import() and must not leak into this pure module.
 */
export const RESOLUTIONS = [
	{ key: 'coarse', label: 'coarse' },
	{ key: 'default', label: 'default' },
	{ key: 'fine', label: 'fine' },
];

/** Playback speeds (frames per second) with their display names. */
export const SPEEDS = [
	{ fps: 6, name: 'Slow' },
	{ fps: 12, name: 'Steady' },
	{ fps: 20, name: 'Fast' },
];

/** Contrast multipliers applied around mid-gray, with their display names. */
export const CONTRASTS = [
	{ value: 0.7, name: 'Soft' },
	{ value: 1, name: 'Normal' },
	{ value: 1.5, name: 'Hard' },
];

/*
 * The pointer halo: a soft magenta glow that tints whatever ASCII sits under the
 * cursor, tracking it while it's over the band. `token` is the Flexoki color it
 * borrows; `radius` is the glow's reach as a fraction of the band's height;
 * `strength` is the tint's opacity at the very center (fading to 0 at the edge).
 */
export const HALO = {
	token: '--bl',
	radius: 0.1,
	strength: .5,
};

/*
 * The field scatter: the animated ASCII behind the title parts around the
 * cursor. Unlike the title's per-letter springs, this is an analytic radial
 * shove (too many cells for per-cell physics) — each cell within reach is pushed
 * straight out, tapering to zero at the edge, with a little per-cell jitter so it
 * reads as scattered rather than a smooth lens. A single `warp` scalar eases the
 * whole thing in and out, so the field flows back when the cursor leaves.
 *
 *   - `influence`: reach as a multiple of the halo radius.
 *   - `strength`:  peak outward shift at the cursor, as a fraction of the halo
 *                  radius (tapering to 0 at the influence edge).
 *   - `jitter`:    per-cell random variation in the shift (0 = uniform push).
 *   - `ease`:      approach rates (per second) for the warp fading in / out.
 */
export const FIELD_SCATTER = {
	influence: 1,
	strength: 0.4,
	jitter: 0.5,
	ease: { in: 16, out: 6 },
};

/*
 * Initial settings. The one place both the markup (which control starts pressed)
 * and the script (initial render state) read from, so they can't disagree.
 *
 * `invert` is deliberately absent: its default is derived from the color scheme
 * at runtime (light glyphs on a dark bg vs. dark ink on paper), and a manual
 * toggle pins it — see scene.ts.
 */
export const DEFAULTS = {
	res: 'fine',
	color: 'tone',
	ramp: 'dense',
	contrast: 1,
	fps: 12,
};

/**
 * Index of the first item in `list` whose `prop` equals `value`, or `fallback`.
 * Lets markup (initial pressed / data-level) and wiring (initial cycle index)
 * derive the same starting position from DEFAULTS.
 *
 * @template T
 * @param {T[]} list
 * @param {keyof T} prop
 * @param {unknown} value
 * @param {number} [fallback]
 * @returns {number}
 */
export function indexOfKey(list, prop, value, fallback = 0) {
	const i = list.findIndex((item) => item[prop] === value);
	return i < 0 ? fallback : i;
}
