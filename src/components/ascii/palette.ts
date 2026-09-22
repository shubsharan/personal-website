import { HALO } from './config.mjs';
import type { Frameset } from './types';

export type PaletteSnapshot = {
	palette: string[];
	bgColor: string;
	titleColor: string;
	haloColor: string;
	haloFade: string;
};

let probe: CanvasRenderingContext2D | null = null;

function toRgb(color: string): [number, number, number] {
	const c = color.trim();
	if (!c) return [129, 140, 248];
	if (!probe) {
		const canvas = document.createElement('canvas');
		canvas.width = 1;
		canvas.height = 1;
		probe = canvas.getContext('2d', { willReadFrequently: true });
	}
	if (!probe) return [129, 140, 248];
	probe.fillStyle = '#000';
	probe.fillStyle = c;
	probe.fillRect(0, 0, 1, 1);
	const [r, g, b] = probe.getImageData(0, 0, 1, 1).data;
	return [r, g, b];
}

export function createPaletteReader(title: HTMLElement | null, scope: HTMLElement) {
	return {
		read(active: Frameset): PaletteSnapshot {
			const styles = getComputedStyle(scope);
			const palette = active.palette.map((token) => styles.getPropertyValue(token).trim());
			const bgColor = styles.getPropertyValue('--background').trim();
			const titleColor = title ? getComputedStyle(title).color : '';
			const [r, g, b] = toRgb(styles.getPropertyValue(HALO.token));
			const haloColor = `rgba(${r}, ${g}, ${b}, ${HALO.strength})`;
			const haloFade = `rgba(${r}, ${g}, ${b}, 0)`;
			return { palette, bgColor, titleColor, haloColor, haloFade };
		},
	};
}
