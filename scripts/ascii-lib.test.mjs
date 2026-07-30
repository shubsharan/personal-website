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
	// Default (invert): dark source -> dense ink, bright source -> empty.
	assert.equal(byteToChar(0), RAMP[RAMP.length - 1]);
	assert.equal(byteToChar(255), RAMP[0]);
	// Non-inverted: bright source -> dense.
	assert.equal(byteToChar(255, { invert: false }), RAMP[RAMP.length - 1]);
	assert.equal(byteToChar(0, { invert: false }), RAMP[0]);
});

test('frameToText lays out rows x cols', () => {
	// 2x2, all dark -> a 2x2 block of the densest char, newline-joined.
	const dense = RAMP[RAMP.length - 1];
	const text = frameToText(Uint8Array.from([0, 0, 0, 0]), 2, 2);
	assert.equal(text, `${dense}${dense}\n${dense}${dense}`);
});

test('cellFromRgb: bright -> max level, dark -> level 0', () => {
	assert.equal(cellFromRgb(255, 255, 255)[0], 15);
	assert.equal(cellFromRgb(0, 0, 0)[0], 0);
});

test('cellFromRgb: grays stay ink (0), saturated hues bucket to accents', () => {
	// Mid gray: unsaturated -> ink.
	assert.equal(cellFromRgb(128, 128, 128)[1], 0);
	// Saturated but not too bright samples -> their hue buckets.
	assert.equal(cellFromRgb(180, 60, 40)[1], 1); // warm -> --or
	assert.equal(cellFromRgb(40, 60, 180)[1], 2); // blue -> --bl
	assert.equal(cellFromRgb(40, 170, 80)[1], 3); // green -> --cy
});

test('rgbStreamToColorFrames packs one char per cell (level*4 + color)', () => {
	// One 2x1 frame: white pixel (level 15, color 0) then black (level 0, color 0).
	const buf = Uint8Array.from([255, 255, 255, 0, 0, 0]);
	const frames = rgbStreamToColorFrames(buf, 2, 1);
	assert.equal(frames.length, 1);
	assert.equal(frames[0].length, 2);
	assert.equal(frames[0][0], PACK_ALPHABET[15 * 4 + 0]); // white
	assert.equal(frames[0][1], PACK_ALPHABET[0]); // black
	// Round-trips back to level/color.
	const code = PACK_ALPHABET.indexOf(frames[0][0]);
	assert.equal(code >> 2, 15);
	assert.equal(code & 3, 0);
});

test('streamToFrames splits on frame size and drops partials', () => {
	const cols = 2;
	const rows = 1;
	// Two full frames (2 bytes each) plus a 1-byte trailing partial.
	const buf = Uint8Array.from([0, 255, 255, 0, 0]);
	const frames = streamToFrames(buf, cols, rows);
	assert.equal(frames.length, 2);
	assert.equal(frames[0], `${RAMP[RAMP.length - 1]}${RAMP[0]}`);
	assert.equal(frames[1], `${RAMP[0]}${RAMP[RAMP.length - 1]}`);
});
