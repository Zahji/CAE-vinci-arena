import { describe, expect, test, vi, afterEach } from 'vitest';
import { toLocalDateInputValue, formatDateTime } from './dateUtils';

describe('formatDateTime', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  test('formats a datetime string to French locale with hour', () => {
    const result = formatDateTime('2026-04-23T13:05:00');
    expect(result).toBe('23/04/2026 à 13h05');
  });

  test('pads single-digit minutes with a leading zero', () => {
    const result = formatDateTime('2026-01-05T09:03:00');
    expect(result).toBe('05/01/2026 à 09h03');
  });

  test('returns the raw string when Date throws', () => {
    vi.spyOn(globalThis, 'Date').mockImplementationOnce(() => {
      throw new Error('invalid');
    });

    const result = formatDateTime('not-a-date');
    expect(result).toBe('not-a-date');
  });
});

describe('toLocalDateInputValue', () => {
  test('converts a Date to YYYY-MM-DD format', () => {
    const date = new Date('2026-03-15T12:00:00');
    expect(toLocalDateInputValue(date)).toBe('2026-03-15');
  });

  test('pads single-digit months and days with leading zero', () => {
    const date = new Date('2026-01-05T12:00:00');
    expect(toLocalDateInputValue(date)).toBe('2026-01-05');
  });

  test('handles December correctly', () => {
    const date = new Date('2026-12-25T12:00:00');
    expect(toLocalDateInputValue(date)).toBe('2026-12-25');
  });
});
