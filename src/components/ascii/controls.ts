/*
 * The three chrome-less control shapes the settings bar is built from. Each is a
 * tiny factory that wires one <button> (or a group of them) to a callback; the
 * scene passes the callbacks that mutate render state. Collapsing the five
 * hand-written control blocks into these keeps behavior (and accessibility) in
 * one place.
 */

/**
 * Mirror a label into both `aria-label` (assistive tech) and `title` (a hover
 * tooltip for sighted mouse users) — the icon-only buttons carry no visible text.
 */
export function setLabel(el: Element | null, text: string) {
	el?.setAttribute('aria-label', text);
	el?.setAttribute('title', text);
}

/**
 * A group of sibling toggles where exactly one is active (color, style). Clicking
 * one lights it (aria-pressed) and dims the rest, then reports the chosen button.
 */
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
	/** The ordered values this control steps through. */
	items: T[];
	/** Which item is shown first (usually derived from DEFAULTS). */
	initialIndex: number;
	/** Paint the button for `item` — its icon variant and label. */
	render: (item: T, index: number, btn: HTMLButtonElement) => void;
	/** Apply the newly-selected item. May be async; re-entrancy is guarded. */
	onChange: (item: T, index: number) => void | Promise<void>;
};

/**
 * One button that cycles through `items` on click (detail, contrast, speed). If
 * `onChange` returns a promise (e.g. detail loads a new frameset), further clicks
 * are ignored until it settles, so the index and the loaded data can't desync.
 *
 * Returns a `set()` handle so a sibling control over the same items (e.g. the
 * mobile row's one-button-per-option group) can keep this button's icon in sync
 * when IT is the one that changed the selection, without re-firing `onChange`.
 */
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

/**
 * A single on/off button (invert). Reflects state into aria-pressed and reports
 * each new value on click. `set()` lets the scene drive it programmatically (e.g.
 * follow a live theme change) WITHOUT firing onChange, so that isn't mistaken for
 * a manual toggle.
 */
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
