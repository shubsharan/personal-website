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
