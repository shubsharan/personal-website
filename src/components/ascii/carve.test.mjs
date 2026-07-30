import assert from 'node:assert/strict';
import { test } from 'node:test';
import { boxBlur, coverageLevels, coverageMask, dilateMask } from './carve.mjs';

/** Count set cells in a mask. */
const count = (m) => m.reduce((n, v) => n + v, 0);
/** Read a cell (x, y) out of a row-major mask. */
const at = (m, cols, x, y) => m[y * cols + x];

// With a 1px-per-cell raster, each cell's coverage is just its own pixel, so
// the mask is `alpha > alphaFloor` per pixel — easy to reason about.
const ONE_TO_ONE = { cols: 4, rows: 4, threshold: 0.5 };

test('an all-transparent raster carves nothing', () => {
	const mask = coverageMask(new Uint8Array(16), 4, 4, ONE_TO_ONE);
	assert.equal(mask.length, 16);
	assert.equal(count(mask), 0);
});

test('cells map to covered pixels above the alpha floor', () => {
	const alpha = new Uint8Array(16);
	alpha[0] = 255; // (0,0) opaque
	alpha[5] = 200; // (1,1) opaque
	alpha[10] = 8; // (2,2) faint — below floor, ignored
	const mask = coverageMask(alpha, 4, 4, ONE_TO_ONE);
	assert.equal(at(mask, 4, 0, 0), 1);
	assert.equal(at(mask, 4, 1, 1), 1);
	assert.equal(at(mask, 4, 2, 2), 0);
	assert.equal(count(mask), 2);
});

test('a counter (hole) stays un-carved — ASCII shows through', () => {
	const alpha = Uint8Array.from([
		255, 255, 255,
		255, 0, 255,
		255, 255, 255,
	]);
	const mask = coverageMask(alpha, 3, 3, { cols: 3, rows: 3, threshold: 0.5 });
	assert.equal(at(mask, 3, 1, 1), 0); // the hole
	assert.equal(count(mask), 8); // the ring
});

test('every pixel is counted, so a thin stroke still carves its cell', () => {
	// One 4x4 cell; a single vertical ink column (4 of 16 px = 0.25 coverage).
	const alpha = new Uint8Array(16);
	for (let y = 0; y < 4; y++) alpha[y * 4 + 1] = 255;
	// A low threshold carves it; a high one (demanding majority ink) does not.
	assert.equal(count(coverageMask(alpha, 4, 4, { cols: 1, rows: 1, threshold: 0.15 })), 1);
	assert.equal(count(coverageMask(alpha, 4, 4, { cols: 1, rows: 1, threshold: 0.5 })), 0);
});

test('lower threshold carves more cells (cleaner, no ASCII under strokes)', () => {
	// Left cell fully ink (1.0), right cell quarter ink (0.25).
	const alpha = Uint8Array.from([
		255, 255, 255, 0,
		255, 255, 0, 0,
	]);
	const low = coverageMask(alpha, 4, 2, { cols: 2, rows: 1, threshold: 0.1 });
	const high = coverageMask(alpha, 4, 2, { cols: 2, rows: 1, threshold: 0.9 });
	assert.equal(count(low), 2);
	assert.equal(count(high), 1);
	assert.ok(count(low) > count(high));
});

test('dilate grows the carved region to clear the fringe', () => {
	// A single covered cell in the middle of a 5x5 grid.
	const alpha = new Uint8Array(25);
	alpha[2 * 5 + 2] = 255;
	const tight = coverageMask(alpha, 5, 5, { cols: 5, rows: 5, threshold: 0.5 });
	const grown = coverageMask(alpha, 5, 5, { cols: 5, rows: 5, threshold: 0.5, dilate: 1 });
	assert.equal(count(tight), 1);
	assert.equal(count(grown), 9); // the cell plus its 8 neighbours
});

test('dilateMask clamps at the grid edges', () => {
	const mask = new Uint8Array(9); // 3x3
	mask[0] = 1; // top-left corner
	const grown = dilateMask(mask, 3, 3, 1);
	assert.equal(count(grown), 4); // corner + right + down + diagonal, no wrap
});

test('coverageLevels reports per-cell ink fraction as 0..255', () => {
	// One 4x4 cell, 4 of 16 pixels ink -> 0.25 -> ~64.
	const alpha = new Uint8Array(16);
	for (let y = 0; y < 4; y++) alpha[y * 4 + 1] = 255;
	const levels = coverageLevels(alpha, 4, 4, { cols: 1, rows: 1 });
	assert.equal(levels[0], Math.round((4 / 16) * 255));
});

test('coverageLevels: full cell = 255, empty cell = 0', () => {
	// 2x2 raster, left pixel column ink on both rows -> left cell full, right empty.
	const alpha = Uint8Array.from([
		255, 0,
		255, 0,
	]);
	const levels = coverageLevels(alpha, 2, 2, { cols: 2, rows: 1 });
	assert.equal(levels[0], 255); // left cell fully ink
	assert.equal(levels[1], 0); // right cell empty
});

test('boxBlur spreads a hot cell to its neighbours and leaves far cells cold', () => {
	// A single 255 cell in the middle of a 5x5 grid, radius 1.
	const src = new Uint8Array(25);
	src[2 * 5 + 2] = 255;
	const out = boxBlur(src, 5, 5, 1);
	assert.ok(out[2 * 5 + 2] > 0, 'centre stays warm');
	assert.ok(out[2 * 5 + 1] > 0, 'orthogonal neighbour warms up');
	assert.equal(out[2 * 5 + 0], 0, 'two cells away (outside radius reach) stays cold');
	assert.equal(out[0], 0, 'far corner stays cold');
});

test('boxBlur preserves a uniform field', () => {
	const src = new Uint8Array(9).fill(100);
	const out = boxBlur(src, 3, 3, 1);
	for (const v of out) assert.equal(v, 100);
});

test('boxBlur with radius 0 is a copy', () => {
	const src = Uint8Array.from([1, 2, 3, 4]);
	const out = boxBlur(src, 2, 2, 0);
	assert.deepEqual([...out], [1, 2, 3, 4]);
});

test('degenerate raster dimensions yield an empty mask, not a throw', () => {
	const mask = coverageMask(new Uint8Array(0), 0, 0, { cols: 3, rows: 2 });
	assert.equal(mask.length, 6);
	assert.equal(count(mask), 0);
});
