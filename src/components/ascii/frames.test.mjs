import assert from 'node:assert/strict';
import { test } from 'node:test';
import { buildLut, densestFrame, posterText } from './frames.mjs';

const PACK = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
const lut = buildLut(PACK);

const cell = (level, color) => PACK[level * 4 + color];

test('buildLut round-trips the pack alphabet (charCode -> code)', () => {
	assert.equal(lut.length, 128);
	for (let code = 0; code < PACK.length; code++) {
		assert.equal(lut[PACK.charCodeAt(code)], code);
	}
});

test('buildLut decodes level and color for a packed cell', () => {
	const ch = cell(11, 2);
	const code = lut[ch.charCodeAt(0)];
	assert.equal(code >> 2, 11);
	assert.equal(code & 3, 2);
});

test('densestFrame picks the frame with the most bright (level>2) cells', () => {
	const dim = cell(1, 0) + cell(2, 0) + cell(0, 0);
	const bright = cell(9, 0) + cell(1, 0) + cell(15, 0);
	assert.equal(densestFrame([dim, bright], lut), bright);
});

test('densestFrame keeps the earlier frame on a tie', () => {
	const a = cell(15, 0) + cell(0, 0);
	const b = cell(0, 0) + cell(15, 0);
	assert.equal(densestFrame([a, b], lut), a);
});

test('densestFrame returns empty string for no frames', () => {
	assert.equal(densestFrame([], lut), '');
});

test('posterText maps each cell level onto the ramp at the given dimensions', () => {
	const ramp = ' .:-=+*#%@';
	const frame = cell(0, 1) + cell(15, 3);
	const text = posterText(frame, { cols: 2, rows: 1, lut, ramp });
	assert.equal(text, ` ${ramp[9]}`);
});

test('posterText emits one line per row', () => {
	const ramp = ' .:-=+*#%@';
	const frame = cell(0, 0).repeat(6);
	const text = posterText(frame, { cols: 3, rows: 2, lut, ramp });
	assert.equal(text.split('\n').length, 2);
	assert.equal(text, '   \n   ');
});

test('posterText returns empty string for a falsy frame', () => {
	assert.equal(posterText('', { cols: 4, rows: 4, lut, ramp: ' .:@' }), '');
});
