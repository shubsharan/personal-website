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

type DatePrecision = 'year' | 'month';

function twoDigitYear(date: Date): string {
	return String(date.getUTCFullYear()).slice(-2);
}

function tenureLabel(date: Date, precision: DatePrecision): string {
	switch (precision) {
		case 'month':
			return `${String(date.getUTCMonth() + 1).padStart(2, '0')}.${twoDigitYear(date)}`;
		case 'year':
			return twoDigitYear(date);
		default: {
			const exhaustive: never = precision;
			return exhaustive;
		}
	}
}

export function span(
	startDate: Date,
	endDate?: Date,
	precision: DatePrecision = 'year',
): string {
	const start = tenureLabel(startDate, precision);
	if (!endDate) return `${start}-Now`;
	const end = tenureLabel(endDate, precision);
	return start === end ? start : `${start}-${end}`;
}
