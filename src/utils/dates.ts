/*
 * Frontmatter dates are bare days ("2026-06-18"), which Zod coerces to UTC
 * midnight. Formatting those in a negative-offset timezone would land on the
 * previous day, so every formatter here reads them back in UTC.
 */

/** "Mar 2026" — the rail format on the writing index. */
export function monthYear(date: Date): string {
	return date.toLocaleDateString('en-US', {
		month: 'short',
		year: 'numeric',
		timeZone: 'UTC',
	});
}

/** "March 4, 2026" — the long format on an entry page. */
export function longDate(date: Date): string {
	return date.toLocaleDateString('en-US', {
		year: 'numeric',
		month: 'long',
		day: 'numeric',
		timeZone: 'UTC',
	});
}

/**
 * "2024–now" while a project is going, "2021–2023" once it isn't, and a bare
 * "2024" when it started and finished in the same year.
 */
export function span(startDate: Date, endDate?: Date): string {
	const start = startDate.getUTCFullYear();
	if (!endDate) return `${start}–now`;
	const end = endDate.getUTCFullYear();
	return start === end ? `${start}` : `${start}–${end}`;
}
