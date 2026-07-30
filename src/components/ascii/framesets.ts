/*
 * The browser-side asset graph for the ASCII scene — kept out of the pure
 * ascii-config module because it fetches the pre-baked frame JSON and touches the
 * DOM (the shared offscreen raster).
 *
 * Every variant (including the initial `fine` one) is imported with Vite's `?url`
 * suffix, so the multi-MB JSON is emitted as a standalone hashed asset and
 * `fetch`ed on demand rather than inlined into the page's JS bundle. The scene
 * paints the server-rendered poster until the fetched frames arrive. Each URL is
 * fetched at most once and its parsed promise cached, so re-selecting a variant
 * (or the boot + the detail toggle both asking for `fine`) never refetches.
 */
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

/** The frameset the scene boots with — the fine variant, same as VARIANTS.fine. */
export const loadDefault = (): Promise<Frameset> => load(fineUrl);

/** Lazy loaders for the pre-baked resolution variants, keyed by RESOLUTIONS.key. */
export const VARIANTS: Record<string, () => Promise<Frameset>> = {
	coarse: () => load(coarseUrl),
	default: () => load(defaultUrl),
	fine: () => load(fineUrl),
};

/*
 * One offscreen raster, shared across every scene on the page (there is only ever
 * one). The title carver draws the heading here and reads back its alpha channel.
 */
export const rasterCanvas = document.createElement('canvas');
export const rasterCtx = rasterCanvas.getContext('2d', { willReadFrequently: true });
