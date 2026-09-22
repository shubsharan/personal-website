export type Frameset = {
	cols: number;
	rows: number;
	fps: number;
	frames: string[];
	palette: string[];
	pack: string;
	levels?: number;
};

export type SceneState = {
	res: string;
	color: string;
	ramp: string;
	contrast: number;
	invert: boolean;
	fps: number;
};

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

export type TitleMasks = {
	titleMask: Uint8Array | null;
	fine: { cols: number; rows: number } | null;
	letters: TitleLetter[] | null;
};
