import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
	COLORS,
	CONTRASTS,
	DEFAULTS,
	PER_CELL_COLORS,
	RAMPS,
	RAMP_ORDER,
	RESOLUTIONS,
	SINGLE,
	SPEEDS,
	indexOfKey,
} from './config.mjs';

// These tests replace the manual "keep the two files in sync" burden: they fail
// loudly if a toggle in the toolbar has no backing behavior, or if an initial
// default points at a control that doesn't exist.

test('every ramp toggle shown has a real ramp behind it', () => {
	for (const { key } of RAMP_ORDER) {
		assert.ok(key in RAMPS, `RAMP_ORDER key "${key}" is missing from RAMPS`);
	}
});

test('single-color modes map onto contiguous palette indices from 0', () => {
	const singles = COLORS.filter((c) => !PER_CELL_COLORS.includes(c.key));
	const indices = singles.map((c) => SINGLE[c.key]);
	assert.deepEqual(
		indices,
		singles.map((_, i) => i),
	);
	// Per-cell modes (full / tone) are not single-color buckets.
	for (const key of PER_CELL_COLORS) assert.equal(SINGLE[key], undefined);
});

test('DEFAULTS resolve to real ramp / color / resolution entries', () => {
	assert.ok(DEFAULTS.ramp in RAMPS);
	assert.ok(COLORS.some((c) => c.key === DEFAULTS.color));
	assert.ok(RESOLUTIONS.some((r) => r.key === DEFAULTS.res));
});

test('DEFAULTS.fps and DEFAULTS.contrast are selectable steps', () => {
	assert.ok(SPEEDS.some((s) => s.fps === DEFAULTS.fps));
	assert.ok(CONTRASTS.some((c) => c.value === DEFAULTS.contrast));
});

test('indexOfKey finds the matching entry, or falls back', () => {
	assert.equal(indexOfKey(RESOLUTIONS, 'key', 'default'), 1);
	assert.equal(indexOfKey(SPEEDS, 'fps', DEFAULTS.fps), 1);
	assert.equal(indexOfKey(CONTRASTS, 'value', DEFAULTS.contrast), 1);
	assert.equal(indexOfKey(RESOLUTIONS, 'key', 'nope', 0), 0);
});
