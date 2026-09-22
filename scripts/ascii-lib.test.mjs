import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
	PACK_ALPHABET,
	RAMP,
	byteToChar,
	cellFromRgb,
	frameToText,
	rgbStreamToColorFrames,
	streamToFrames,
} from './ascii-lib.mjs';

test('byteToChar maps polarity correctly', () => {
	assert.equal(byteToChar(0), RAMP[RAMP.length - 1]);
	assert.equal(byteToChar(255), RAMP[0]);
	assert.equal(byteToChar(255, { invert: false }), RAMP[RAMP.length - 1]);
	assert.equal(byteToChar(0, { invert: false }), RAMP[0]);
});

test('frameToText lays out rows x cols', () => {
	const dense = RAMP[RAMP.length - 1];
	const text = frameToText(Uint8Array.from([0, 0, 0, 0]), 2, 2);
	assert.equal(text, `${dense}${dense}\n${dense}${dense}`);
});

test('cellFromRgb: bright -> max level, dark -> level 0', () => {
	assert.equal(cellFromRgb(255, 255, 255)[0], 15);
	assert.equal(cellFromRgb(0, 0, 0)[0], 0);
});

test('cellFromRgb: grays stay ink (0), saturated hues bucket to accents', () => {
	assert.equal(cellFromRgb(128, 128, 128)[1], 0);
	assert.equal(cellFromRgb(180, 60, 40)[1], 1);
	assert.equal(cellFromRgb(40, 60, 180)[1], 2);
	assert.equal(cellFromRgb(40, 170, 80)[1], 3);
});

test('rgbStreamToColorFrames packs one char per cell (level*4 + color)', () => {
	const buf = Uint8Array.from([255, 255, 255, 0, 0, 0]);
	const frames = rgbStreamToColorFrames(buf, 2, 1);
	assert.equal(frames.length, 1);
	assert.equal(frames[0].length, 2);
	assert.equal(frames[0][0], PACK_ALPHABET[15 * 4 + 0]);
	assert.equal(frames[0][1], PACK_ALPHABET[0]);
	const code = PACK_ALPHABET.indexOf(frames[0][0]);
	assert.equal(code >> 2, 15);
	assert.equal(code & 3, 0);
});

test('streamToFrames splits on frame size and drops partials', () => {
	const cols = 2;
	const rows = 1;
	const buf = Uint8Array.from([0, 255, 255, 0, 0]);
	const frames = streamToFrames(buf, cols, rows);
	assert.equal(frames.length, 2);
	assert.equal(frames[0], `${RAMP[RAMP.length - 1]}${RAMP[0]}`);
	assert.equal(frames[1], `${RAMP[0]}${RAMP[RAMP.length - 1]}`);
});
