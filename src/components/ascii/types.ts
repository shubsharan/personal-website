/* Shared types for the ASCII scene's client modules. */

/** A decoded frameset (one resolution variant), as loaded from apollo-ascii*.json. */
export type Frameset = {
	cols: number;
	rows: number;
	fps: number;
	frames: string[];
	palette: string[];
	pack: string;
	levels?: number;
};

/** Live, user-tunable render settings. Initialized from ascii-config's DEFAULTS. */
export type SceneState = {
	res: string;
	color: string;
	ramp: string;
	contrast: number;
	invert: boolean;
	fps: number;
};

/**
 * One title letter as its own little ASCII bitmap, positioned on the shared fine
 * grid so letters can be displaced independently (the pointer scatter) yet still
 * line up as one word at rest. `solid`/`outline` are row-major 0/1 masks over a
 * `cols`×`rows` box (the glyph itself, and a dilated ring for legibility); the
 * renderer maps them to the current ramp glyph so the title still follows the
 * style control. `col`/`row` place the box's top-left on the fine grid; `cx`/`cy`
 * are its home center in CSS px, which the spring physics pushes from and returns
 * to.
 */
export type TitleLetter = {
	solid: Uint8Array;
	outline: Uint8Array;
	cols: number;
	rows: number;
	col: number;
	row: number;
	cx: number;
	cy: number;
};

/** The data the renderer needs to carve the heading into the field. */
export type TitleMasks = {
	/** Coarse mask on the animation grid: 1 = blank this cell (title sits here). */
	titleMask: Uint8Array | null;
	/** The fine grid's dimensions, so the renderer can size the title font/cells. */
	fine: { cols: number; rows: number } | null;
	/** Per-letter bitmaps, drawn crisply on top and displaced by the physics. */
	letters: TitleLetter[] | null;
};
