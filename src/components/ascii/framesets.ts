import type { Frameset } from './types';
import fineUrl from '../../assets/apollo-ascii-fine.json?url';
import coarseUrl from '../../assets/apollo-ascii-coarse.json?url';
import defaultUrl from '../../assets/apollo-ascii.json?url';

const cache = new Map<string, Promise<Frameset>>();

const load = (url: string): Promise<Frameset> => {
	let pending = cache.get(url);
	if (!pending) {
		pending = fetch(url).then((r) => r.json() as Promise<Frameset>);
		cache.set(url, pending);
	}
	return pending;
};

export const loadDefault = (): Promise<Frameset> => load(fineUrl);

export const VARIANTS: Record<string, () => Promise<Frameset>> = {
	coarse: () => load(coarseUrl),
	default: () => load(defaultUrl),
	fine: () => load(fineUrl),
};

export const rasterCanvas = document.createElement('canvas');
export const rasterCtx = rasterCanvas.getContext('2d', { willReadFrequently: true });
