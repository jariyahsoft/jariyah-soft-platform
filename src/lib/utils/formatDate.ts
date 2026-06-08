/**
 * Buddhist Era date formatting helper.
 *
 * Thai locale uses the Buddhist calendar (543 years ahead of Gregorian).
 * English locale uses standard Gregorian.
 */
export function formatDate(
  date: Date,
  locale: string,
  options?: Intl.DateTimeFormatOptions
): string {
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    ...options,
  };

  const resolvedLocale =
    locale === 'th' ? 'th-TH-u-ca-buddhist' : 'en-US';

  return new Intl.DateTimeFormat(resolvedLocale, defaultOptions).format(date);
}

/**
 * Short date format (e.g. "8 มิ.ย. 2568" or "Jun 8, 2025")
 */
export function formatDateShort(date: Date, locale: string): string {
  return formatDate(date, locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Relative time helper (e.g. "3 days ago")
 */
export function formatRelativeTime(date: Date, locale: string): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  const rtf = new Intl.RelativeTimeFormat(locale === 'th' ? 'th' : 'en', {
    numeric: 'auto',
  });

  if (diffDays > 30) return formatDateShort(date, locale);
  if (diffDays > 0) return rtf.format(-diffDays, 'day');
  if (diffHours > 0) return rtf.format(-diffHours, 'hour');
  if (diffMinutes > 0) return rtf.format(-diffMinutes, 'minute');
  return rtf.format(-diffSeconds, 'second');
}
