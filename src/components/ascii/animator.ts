/*
 * The requestAnimationFrame cadence for the band. The scene supplies the current
 * fps (a getter, so speed changes take effect immediately) and an onFrame
 * callback (advance + render). The band loops forever — there is no play/pause
 * control; pause() exists only so a reduced-motion preference can freeze it on
 * the poster frame. Cleans itself up on pagehide.
 */
type AnimatorDeps = {
	getFps: () => number;
	onFrame: () => void;
};

export function createAnimator({ getFps, onFrame }: AnimatorDeps) {
	let handle = 0;
	let playing = false;
	let lastPaint = 0;

	const loop = (t: number) => {
		handle = requestAnimationFrame(loop);
		const interval = 1000 / getFps();
		if (t - lastPaint < interval) return;
		lastPaint = t - ((t - lastPaint) % interval);
		onFrame();
	};

	const play = () => {
		if (playing) return;
		playing = true;
		lastPaint = 0;
		handle = requestAnimationFrame(loop);
	};

	const pause = () => {
		if (!playing) return;
		playing = false;
		cancelAnimationFrame(handle);
	};

	window.addEventListener('pagehide', () => cancelAnimationFrame(handle), { once: true });

	return {
		play,
		pause,
		get playing() {
			return playing;
		},
	};
}
