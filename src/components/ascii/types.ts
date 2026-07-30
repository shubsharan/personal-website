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

/** A fine title grid: `solid` = the letters, `outline` = a bg ring around them. */
export type TitleFine = {
	solid: Uint8Array;
	outline: Uint8Array;
	cols: number;
	rows: number;
};

/** The two grids the renderer needs to carve the heading into the field. */
export type TitleMasks = {
	/** Coarse mask on the animation grid: 1 = blank this cell (title sits here). */
	titleMask: Uint8Array | null;
	/** The title's own fine grid, drawn crisply on top. */
	titleFine: TitleFine | null;
};
