export function setLabel(el: Element | null, text: string) {
	el?.setAttribute('aria-label', text);
	el?.setAttribute('title', text);
}

export function groupControl(
	buttons: Iterable<HTMLButtonElement>,
	onSelect: (btn: HTMLButtonElement) => void,
) {
	const list = Array.from(buttons);
	list.forEach((btn) =>
		btn.addEventListener('click', () => {
			list.forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
			onSelect(btn);
		}),
	);
}

export type CycleOptions<T> = {
	items: T[];
	initialIndex: number;
	render: (item: T, index: number, btn: HTMLButtonElement) => void;
	onChange: (item: T, index: number) => void | Promise<void>;
};

export function cycleControl<T>(btn: HTMLButtonElement | null, opts: CycleOptions<T>) {
	if (!btn) return null;
	let index = opts.initialIndex;
	let busy = false;

	const paint = () => opts.render(opts.items[index], index, btn);

	btn.addEventListener('click', async () => {
		if (busy) return;
		const next = (index + 1) % opts.items.length;
		busy = true;
		try {
			await opts.onChange(opts.items[next], next);
			index = next;
			paint();
		} finally {
			busy = false;
		}
	});

	paint();

	return {
		set(next: number) {
			index = next;
			paint();
		},
	};
}

export function toggleControl(
	btn: HTMLButtonElement | null,
	initial: boolean,
	onChange: (on: boolean) => void,
) {
	if (!btn) return null;
	let on = initial;
	const reflect = () => btn.setAttribute('aria-pressed', String(on));
	reflect();
	btn.addEventListener('click', () => {
		on = !on;
		reflect();
		onChange(on);
	});
	return {
		set(value: boolean) {
			on = value;
			reflect();
		},
	};
}
