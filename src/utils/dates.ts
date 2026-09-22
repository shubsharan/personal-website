export function shortDate(date: Date): string {
	const mm = String(date.getUTCMonth() + 1).padStart(2, '0');
	const dd = String(date.getUTCDate()).padStart(2, '0');
	const yy = String(date.getUTCFullYear()).slice(-2);
	return `${mm}.${dd}.${yy}`;
}

export function monthYear(date: Date): string {
	return date.toLocaleDateString('en-US', {
		month: 'short',
		year: 'numeric',
		timeZone: 'UTC',
	});
}

export function longDate(date: Date): string {
	return date.toLocaleDateString('en-US', {
		year: 'numeric',
		month: 'long',
		day: 'numeric',
		timeZone: 'UTC',
	});
}

export function span(startDate: Date, endDate?: Date): string {
	const start = startDate.getUTCFullYear();
	if (!endDate) return `${start}–now`;
	const end = endDate.getUTCFullYear();
	return start === end ? `${start}` : `${start}–${end}`;
}
