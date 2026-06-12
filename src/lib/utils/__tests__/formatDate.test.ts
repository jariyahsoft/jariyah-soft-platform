import { formatDate, formatDateShort, formatRelativeTime } from '@/lib/utils/formatDate';

describe('formatDate utilities', () => {
  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(new Date('2026-06-13T00:00:00Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('formats Thai dates with the Buddhist Era year', () => {
    const formatted = formatDate(new Date('2025-06-08T00:00:00Z'), 'th');

    expect(formatted).toMatch(/2568|๒๕๖๘/);
  });

  it('formats English short dates with the Gregorian year', () => {
    const formatted = formatDateShort(new Date('2025-06-08T00:00:00Z'), 'en');

    expect(formatted).toContain('2025');
  });

  it('returns relative dates for recent timestamps and falls back for older ones', () => {
    expect(formatRelativeTime(new Date('2026-06-10T00:00:00Z'), 'en')).toBe('3 days ago');

    const older = formatRelativeTime(new Date('2026-04-01T00:00:00Z'), 'en');
    expect(older).toContain('2026');
  });
});
