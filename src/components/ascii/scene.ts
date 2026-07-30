/*
 * Composes the ASCII band for one `[data-ascii-frame]` root: owns the live state
 * and current frame index, wires the factories together (palette, title carver,
 * renderer, animator) and the settings-bar controls, and handles boot, resize,
 * theme, reduced-motion, and webfont settling. Everything DOM- or state-bound
 * lives here; the pure math is in ../../utils/ascii-{config,frames,carve}.mjs.
 */
import {
	CONTRASTS,
	DEFAULTS,
	RESOLUTIONS,
	SPEEDS,
	indexOfKey,
} from '../../utils/ascii-config.mjs';
import { buildLut, densestFrame } from '../../utils/ascii-frames.mjs';
import { createAnimator } from './animator';
import { cycleControl, groupControl, setLabel, toggleControl } from './controls';
import { rasterCanvas, rasterCtx } from './framesets';
import { createPaletteReader, type PaletteSnapshot } from './palette';
import { createRenderer } from './renderer';
import { createTitleCarver } from './title-carve';
import type { Frameset, SceneState, TitleMasks } from './types';

type SceneDeps = {
	loadDefault: () => Promise<Frameset>;
	variants: Record<string, () => Promise<Frameset>>;
};

const NO_MASKS: TitleMasks = { titleMask: null, titleFine: null };
const NO_PALETTE: PaletteSnapshot = { palette: [], bgColor: '', titleColor: '' };

export async function createAsciiScene(root: HTMLElement, { loadDefault, variants }: SceneDeps) {
	const canvas = root.querySelector<HTMLCanvasElement>('[data-ascii-canvas]');
	const fallback = root.querySelector<HTMLElement>('[data-ascii-fallback]');
	const controls = root.querySelector<HTMLElement>('[data-ascii-controls]');
	const ctx = canvas?.getContext('2d');
	if (!canvas || !fallback || !controls || !ctx) return;

	// The frames are fetched (not bundled), so the poster covers first paint until
	// the default frameset lands; everything below needs a frameset to work from.
	const defaultData = await loadDefault();

	const title = root.querySelector<HTMLElement>('[data-ascii-title]');

	const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
	const darkScheme = window.matchMedia('(prefers-color-scheme: dark)');

	// The renderer leaves dark pixels as empty cells that show the background
	// through, so the brightness ramp is tied to that background: light glyphs on
	// black (dark mode) vs. dark ink on paper (light mode). Default invert to the
	// scheme; a manual toggle pins it and stops it tracking further theme changes.
	const state: SceneState = { ...DEFAULTS, invert: !darkScheme.matches };
	let invertUserSet = false;

	let active: Frameset = defaultData;
	// The pack alphabet is identical across resolution variants, so one LUT serves.
	const lut = buildLut(defaultData.pack);
	let index = 0;
	let masks: TitleMasks = NO_MASKS;
	let snapshot: PaletteSnapshot = NO_PALETTE;

	const paletteReader = createPaletteReader(title);
	const carver = createTitleCarver({ canvas, title, rasterCanvas, rasterCtx });
	const renderer = createRenderer(canvas, ctx, fallback);

	const readPalette = () => {
		snapshot = paletteReader.read(active);
	};
	const rebuildMask = () => {
		masks = carver.rebuild(active);
	};

	const paint = (frame: string) =>
		renderer.render(frame, { active, state, lut, masks, ...snapshot });
	const repaint = () => paint(active.frames[index] ?? active.frames[0]);

	const animator = createAnimator({
		getFps: () => state.fps,
		onFrame: () => {
			paint(active.frames[index]);
			index = (index + 1) % active.frames.length;
		},
	});
	// When the band is running, the loop repaints on its own; only nudge a repaint
	// when it's frozen (reduced motion) and a control changed the look.
	const repaintIfPaused = () => {
		if (!animator.playing) repaint();
	};

	// ---- Controls ---------------------------------------------------------
	cycleControl(controls.querySelector<HTMLButtonElement>('[data-detail]'), {
		items: RESOLUTIONS,
		initialIndex: indexOfKey(RESOLUTIONS, 'key', state.res),
		render: (res, idx, btn) => {
			btn.style.setProperty('--n', String(idx + 1));
			setLabel(btn, `Detail: ${res.label}`);
		},
		onChange: async (res) => {
			active = await variants[res.key]();
			state.res = res.key;
			index = index % active.frames.length;
			readPalette();
			rebuildMask();
			repaintIfPaused();
		},
	});

	groupControl(controls.querySelectorAll<HTMLButtonElement>('[data-color]'), (btn) => {
		state.color = btn.dataset.color!;
		repaintIfPaused();
	});

	groupControl(controls.querySelectorAll<HTMLButtonElement>('[data-ramp]'), (btn) => {
		state.ramp = btn.dataset.ramp!;
		repaintIfPaused();
	});

	cycleControl(controls.querySelector<HTMLButtonElement>('[data-contrast-cycle]'), {
		items: CONTRASTS,
		initialIndex: indexOfKey(CONTRASTS, 'value', state.contrast),
		render: (c, idx, btn) => {
			btn.dataset.level = String(idx);
			setLabel(btn, `Contrast: ${c.name}`);
		},
		onChange: (c) => {
			state.contrast = c.value;
			repaintIfPaused();
		},
	});

	cycleControl(controls.querySelector<HTMLButtonElement>('[data-speed]'), {
		items: SPEEDS,
		initialIndex: indexOfKey(SPEEDS, 'fps', state.fps),
		render: (s, idx, btn) => {
			btn.textContent = '▶'.repeat(idx + 1);
			setLabel(btn, `Speed: ${s.name}`);
		},
		onChange: (s) => {
			state.fps = s.fps;
		},
	});

	const invertToggle = toggleControl(
		controls.querySelector<HTMLButtonElement>('[data-invert]'),
		state.invert,
		(on) => {
			state.invert = on;
			invertUserSet = true; // pin it; stop auto-tracking the OS theme
			repaintIfPaused();
		},
	);

	// ---- Reactivity -------------------------------------------------------
	darkScheme.addEventListener('change', () => {
		// Keep the ink/background relationship correct across a live theme switch —
		// unless the user has taken manual control of the invert.
		if (!invertUserSet) {
			state.invert = !darkScheme.matches;
			invertToggle?.set(state.invert);
		}
		readPalette();
		repaint();
	});
	new ResizeObserver(() => {
		rebuildMask();
		repaintIfPaused();
	}).observe(root);
	reducedMotion.addEventListener('change', (e) => (e.matches ? animator.pause() : animator.play()));

	// ---- Boot -------------------------------------------------------------
	// Give the static-label buttons (color / style / invert) a hover tooltip too;
	// the cycling ones already set title in their render functions.
	controls
		.querySelectorAll<HTMLButtonElement>('button[aria-label]:not([title])')
		.forEach((b) => b.setAttribute('title', b.getAttribute('aria-label') ?? ''));

	readPalette();
	rebuildMask();
	controls.hidden = false;
	paint(densestFrame(active.frames, lut));
	if (!reducedMotion.matches) animator.play();

	// Webfonts (EB Garamond) load async; remeasure once they settle or the carve
	// would sit offset from the painted glyphs on first paint.
	document.fonts?.ready.then(() => {
		rebuildMask();
		repaintIfPaused();
	});
}
