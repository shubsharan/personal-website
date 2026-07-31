/*
 * Composes the ASCII band for one `[data-ascii-frame]` root: owns the live state
 * and current frame index, wires the factories together (palette, title carver,
 * renderer, animator) and the settings-bar controls, and handles boot, resize,
 * theme, reduced-motion, and webfont settling. Everything DOM- or state-bound
 * lives here; the pure math is in ./{config,frames,carve}.mjs.
 */
import {
	CONTRASTS,
	DEFAULTS,
	FIELD_SCATTER,
	HALO,
	RESOLUTIONS,
	SPEEDS,
	indexOfKey,
} from './config.mjs';
import { buildLut, densestFrame } from './frames.mjs';
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

const NO_MASKS: TitleMasks = { titleMask: null, fine: null, letters: null };
const NO_PALETTE: PaletteSnapshot = {
	palette: [],
	bgColor: '',
	titleColor: '',
	haloColor: '',
	haloFade: '',
};

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

	// The band is pinned to the dark palette (data-theme="dark" on its container),
	// so it always renders as light glyphs on black — no invert, no light-mode
	// emboldening — regardless of the site theme. The Invert control can still flip
	// it by hand; it just no longer follows the site.
	const state: SceneState = { ...DEFAULTS, invert: false };

	let active: Frameset = defaultData;
	// The pack alphabet is identical across resolution variants, so one LUT serves.
	const lut = buildLut(defaultData.pack);
	let index = 0;
	let masks: TitleMasks = NO_MASKS;
	let snapshot: PaletteSnapshot = NO_PALETTE;

	// The pointer `halo` lives in CSS px and drives the magenta tint + field shove.
	const halo = { x: 0, y: 0, radius: 0, on: false };
	// Eased 0..1 intensity of the pointer effect (glow + field scatter), so it
	// fades in on enter and flows back out on leave rather than snapping.
	let warp = 0;
	let currentFrame = defaultData.frames[0] ?? '';

	const paletteReader = createPaletteReader(title, canvas);
	const carver = createTitleCarver({ canvas, title, rasterCanvas, rasterCtx });
	const renderer = createRenderer(canvas, ctx, fallback);

	const readPalette = () => {
		snapshot = paletteReader.read(active);
	};
	const rebuildMask = () => {
		masks = carver.rebuild(active);
		halo.radius = canvas.clientHeight * HALO.radius;
	};

	const paint = (frame: string) => {
		currentFrame = frame;
		renderer.render(frame, {
			active,
			state,
			lut,
			masks,
			// Position persists through the ease-out; `warp` gates the effect on.
			halo,
			fieldWarp: warp,
			boldField: false,
			...snapshot,
		});
	};
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

	// ---- Pointer effect ---------------------------------------------------
	// A single eased `warp` scalar drives the magenta glow and the field scatter
	// (the actual displacement is analytic, in the renderer). This loop just eases
	// `warp` toward on/off and repaints on its own rAF at display rate — smoother
	// than the field's slower playback fps — until the cursor leaves and it lands
	// back at zero, when painting is handed back to the field's own loop.
	let physHandle = 0;
	let physRunning = false;
	let lastT = 0;

	const stepPhysics = (t: number) => {
		physHandle = requestAnimationFrame(stepPhysics);
		const dt = lastT ? Math.min((t - lastT) / 1000, 1 / 30) : 1 / 60;
		lastT = t;
		// Ease the warp toward on/off (faster in than out).
		const target = halo.on ? 1 : 0;
		const rate = target > warp ? FIELD_SCATTER.ease.in : FIELD_SCATTER.ease.out;
		warp += (target - warp) * Math.min(1, dt * rate);
		if (Math.abs(target - warp) < 0.001) warp = target;
		paint(currentFrame);
		// Once the cursor is gone and the warp has settled, stop and let the field's
		// own loop take over.
		if (!halo.on && warp === 0) {
			physRunning = false;
			cancelAnimationFrame(physHandle);
		}
	};

	const startPhysics = () => {
		if (physRunning || reducedMotion.matches) return;
		physRunning = true;
		lastT = 0;
		physHandle = requestAnimationFrame(stepPhysics);
	};

	const setHalo = (e: PointerEvent) => {
		if (reducedMotion.matches) return;
		const rect = canvas.getBoundingClientRect();
		halo.x = e.clientX - rect.left;
		halo.y = e.clientY - rect.top;
		halo.radius = canvas.clientHeight * HALO.radius;
		halo.on = true;
		startPhysics();
	};
	const clearHalo = () => {
		halo.on = false;
		startPhysics(); // let the effect ease back out
	};
	canvas.addEventListener('pointerenter', setHalo);
	canvas.addEventListener('pointermove', setHalo);
	canvas.addEventListener('pointerleave', clearHalo);
	canvas.addEventListener('pointercancel', clearHalo);
	window.addEventListener('pagehide', () => cancelAnimationFrame(physHandle), { once: true });

	// ---- Controls ---------------------------------------------------------
	cycleControl(controls.querySelector<HTMLButtonElement>('[data-detail]'), {
		items: RESOLUTIONS,
		initialIndex: indexOfKey(RESOLUTIONS, 'key', state.res),
		render: (res, idx, btn) => {
			btn.dataset.level = String(idx);
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
			btn.dataset.level = String(idx);
			setLabel(btn, `Speed: ${s.name}`);
		},
		onChange: (s) => {
			state.fps = s.fps;
		},
	});

	toggleControl(
		controls.querySelector<HTMLButtonElement>('[data-invert]'),
		state.invert,
		(on) => {
			state.invert = on;
			repaintIfPaused();
		},
	);

	// ---- Reactivity -------------------------------------------------------
	// The band's palette is pinned dark via CSS, so it doesn't react to the site
	// theme at all — no theme listener here. It only re-measures on resize.
	new ResizeObserver(() => {
		rebuildMask();
		repaintIfPaused();
	}).observe(root);
	reducedMotion.addEventListener('change', (e) => {
		if (e.matches) {
			halo.on = false; // drop the pointer effect; physics settles on its own
			animator.pause();
		} else {
			animator.play();
		}
	});

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
