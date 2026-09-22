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

	const defaultData = await loadDefault();

	const title = root.querySelector<HTMLElement>('[data-ascii-title]');

	const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

	const state: SceneState = { ...DEFAULTS, invert: false };

	let active: Frameset = defaultData;
	const lut = buildLut(defaultData.pack);
	let index = 0;
	let masks: TitleMasks = NO_MASKS;
	let snapshot: PaletteSnapshot = NO_PALETTE;

	const halo = { x: 0, y: 0, radius: 0, on: false };
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
	const repaintIfPaused = () => {
		if (!animator.playing) repaint();
	};

	let physHandle = 0;
	let physRunning = false;
	let lastT = 0;

	const stepPhysics = (t: number) => {
		physHandle = requestAnimationFrame(stepPhysics);
		const dt = lastT ? Math.min((t - lastT) / 1000, 1 / 30) : 1 / 60;
		lastT = t;
		const target = halo.on ? 1 : 0;
		const rate = target > warp ? FIELD_SCATTER.ease.in : FIELD_SCATTER.ease.out;
		warp += (target - warp) * Math.min(1, dt * rate);
		if (Math.abs(target - warp) < 0.001) warp = target;
		paint(currentFrame);
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
		startPhysics();
	};
	canvas.addEventListener('pointerenter', setHalo);
	canvas.addEventListener('pointermove', setHalo);
	canvas.addEventListener('pointerleave', clearHalo);
	canvas.addEventListener('pointercancel', clearHalo);
	window.addEventListener('pagehide', () => cancelAnimationFrame(physHandle), { once: true });

	let detailCycle: ReturnType<typeof cycleControl<(typeof RESOLUTIONS)[number]>>;
	const applyDetail = async (res: (typeof RESOLUTIONS)[number], idx: number, fromCycle = false) => {
		active = await variants[res.key]();
		state.res = res.key;
		index = index % active.frames.length;
		readPalette();
		rebuildMask();
		repaintIfPaused();
		if (!fromCycle) detailCycle?.set(idx);
	};
	detailCycle = cycleControl(controls.querySelector<HTMLButtonElement>('[data-detail]'), {
		items: RESOLUTIONS,
		initialIndex: indexOfKey(RESOLUTIONS, 'key', state.res),
		render: (res, idx, btn) => {
			btn.dataset.level = String(idx);
			setLabel(btn, `Detail: ${res.label}`);
		},
		onChange: (res, idx) => applyDetail(res, idx, true),
	});
	groupControl(controls.querySelectorAll<HTMLButtonElement>('[data-detail-option]'), (btn) => {
		const idx = indexOfKey(RESOLUTIONS, 'key', btn.dataset.detailOption);
		applyDetail(RESOLUTIONS[idx], idx);
	});

	groupControl(controls.querySelectorAll<HTMLButtonElement>('[data-color]'), (btn) => {
		state.color = btn.dataset.color!;
		repaintIfPaused();
	});

	groupControl(controls.querySelectorAll<HTMLButtonElement>('[data-ramp]'), (btn) => {
		state.ramp = btn.dataset.ramp!;
		repaintIfPaused();
	});

	let contrastCycleDesktop: ReturnType<typeof cycleControl<(typeof CONTRASTS)[number]>>;
	let contrastCycleMobile: ReturnType<typeof cycleControl<(typeof CONTRASTS)[number]>>;
	const applyContrast = (c: (typeof CONTRASTS)[number], idx: number, source?: 'desktop' | 'mobile') => {
		state.contrast = c.value;
		repaintIfPaused();
		if (source !== 'desktop') contrastCycleDesktop?.set(idx);
		if (source !== 'mobile') contrastCycleMobile?.set(idx);
	};
	const contrastInitialIndex = indexOfKey(CONTRASTS, 'value', state.contrast);
	contrastCycleDesktop = cycleControl(controls.querySelector<HTMLButtonElement>('[data-contrast-cycle]'), {
		items: CONTRASTS,
		initialIndex: contrastInitialIndex,
		render: (c, idx, btn) => {
			btn.dataset.level = String(idx);
			setLabel(btn, `Contrast: ${c.name}`);
		},
		onChange: (c, idx) => applyContrast(c, idx, 'desktop'),
	});
	contrastCycleMobile = cycleControl(controls.querySelector<HTMLButtonElement>('[data-contrast-cycle-mobile]'), {
		items: CONTRASTS,
		initialIndex: contrastInitialIndex,
		render: (c, idx, btn) => {
			btn.dataset.level = String(idx);
			setLabel(btn, `Contrast: ${c.name}`);
		},
		onChange: (c, idx) => applyContrast(c, idx, 'mobile'),
	});

	let speedCycle: ReturnType<typeof cycleControl<(typeof SPEEDS)[number]>>;
	const applySpeed = (s: (typeof SPEEDS)[number], idx: number, fromCycle = false) => {
		state.fps = s.fps;
		if (!fromCycle) speedCycle?.set(idx);
	};
	speedCycle = cycleControl(controls.querySelector<HTMLButtonElement>('[data-speed]'), {
		items: SPEEDS,
		initialIndex: indexOfKey(SPEEDS, 'fps', state.fps),
		render: (s, idx, btn) => {
			btn.dataset.level = String(idx);
			setLabel(btn, `Speed: ${s.name}`);
		},
		onChange: (s, idx) => applySpeed(s, idx, true),
	});
	groupControl(controls.querySelectorAll<HTMLButtonElement>('[data-speed-option]'), (btn) => {
		const idx = indexOfKey(SPEEDS, 'fps', Number(btn.dataset.speedOption));
		applySpeed(SPEEDS[idx], idx);
	});

	toggleControl(
		controls.querySelector<HTMLButtonElement>('[data-invert]'),
		state.invert,
		(on) => {
			state.invert = on;
			repaintIfPaused();
		},
	);

	new ResizeObserver(() => {
		rebuildMask();
		repaintIfPaused();
	}).observe(root);
	reducedMotion.addEventListener('change', (e) => {
		if (e.matches) {
			halo.on = false;
			animator.pause();
		} else {
			animator.play();
		}
	});

	controls
		.querySelectorAll<HTMLButtonElement>('button[aria-label]:not([title])')
		.forEach((b) => b.setAttribute('title', b.getAttribute('aria-label') ?? ''));

	readPalette();
	rebuildMask();
	controls.hidden = false;
	controls.closest('details')?.removeAttribute('hidden');
	paint(densestFrame(active.frames, lut));
	if (!reducedMotion.matches) animator.play();

	document.fonts?.ready.then(() => {
		rebuildMask();
		repaintIfPaused();
	});
}
