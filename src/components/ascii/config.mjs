export const CHAR_W = 0.6;

export const TITLE_CELL_PX = 2;
export const TITLE_FINE_FLOOR = 0.4;
export const CARVE_THRESHOLD = 0.9;
export const CARVE_HALO = 0.2;
export const TITLE_OUTLINE_RADIUS = 2;

export const RAMPS = {
	classic: ' .:-=+*#%@',
	dots: ' .·•●',
	round: ' .oO@',
	dense: ' .:-=+*abcdnuvoxIJCLQ0OZ#MW&8%B@$',
};

export const POSTER_RAMP = RAMPS.classic;

export const RAMP_ORDER = [
	{ key: 'dense', label: 'Dense', sample: '*8@$' },
	{ key: 'classic', label: 'Classic', sample: '.:+#' },
	{ key: 'dots', label: 'Dots', sample: '.·•●' },
	{ key: 'round', label: 'Round', sample: '.oO@' },
];

export const COLORS = [
	{ key: 'tone', label: 'Tone', dot: 'before:bg-[linear-gradient(var(--bl),var(--tx),var(--or))]' },
	{ key: 'full', label: 'Color', dot: 'before:bg-[conic-gradient(var(--or),var(--cy),var(--bl),var(--or))]' },
	{ key: 'ink', label: 'BW', dot: 'before:bg-tx' },
];

export const PER_CELL_COLORS = ['full', 'tone'];
export const SINGLE = Object.fromEntries(
	COLORS.filter((c) => !PER_CELL_COLORS.includes(c.key)).map((c, i) => [c.key, i]),
);

export const RESOLUTIONS = [
	{ key: 'coarse', label: 'coarse' },
	{ key: 'default', label: 'default' },
	{ key: 'fine', label: 'fine' },
];

export const SPEEDS = [
	{ fps: 6, name: 'Slow' },
	{ fps: 12, name: 'Steady' },
	{ fps: 20, name: 'Fast' },
];

export const CONTRASTS = [
	{ value: 0.7, name: 'Soft' },
	{ value: 1, name: 'Normal' },
	{ value: 1.5, name: 'Hard' },
];

export const HALO = {
	token: '--bl',
	radius: 0.1,
	strength: .5,
};

export const FIELD_SCATTER = {
	influence: 1,
	strength: 0.4,
	jitter: 0.5,
	ease: { in: 16, out: 6 },
};

export const DEFAULTS = {
	res: 'fine',
	color: 'tone',
	ramp: 'dense',
	contrast: 1,
	fps: 12,
};

export function indexOfKey(list, prop, value, fallback = 0) {
	const i = list.findIndex((item) => item[prop] === value);
	return i < 0 ? fallback : i;
}
