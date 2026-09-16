import { describe, it, expect, vi } from 'vitest';
import { isOverdue, createStarterBoard, todayISO } from './utils';

describe('isOverdue', () => {
  it('false for null', () => expect(isOverdue(null, '2026-09-16')).toBe(false));
  it('true when before today', () => expect(isOverdue('2026-01-01', '2026-09-16')).toBe(true));
  it('false when today or future', () => {
    expect(isOverdue('2026-09-16', '2026-09-16')).toBe(false);
    expect(isOverdue('2026-12-31', '2026-09-16')).toBe(false);
  });
});
describe('todayISO', () => {
  it('returns the local calendar date (not UTC)', () => {
    vi.useFakeTimers({ now: Date.UTC(2026, 8, 15, 22, 30, 0) }); // 2026-09-15T22:30Z == 2026-09-16 05:30 local (UTC+7)
    expect(todayISO()).toBe('2026-09-16');
    vi.useRealTimers();
  });
});

describe('createStarterBoard', () => {
  it('has 3 columns TO DO / DOING / DONE with no cards', () => {
    const b = createStarterBoard();
    expect(b.columns.map(c => c.title)).toEqual(['TO DO', 'DOING', 'DONE']);
    expect(b.columns.every(c => c.cards.length === 0)).toBe(true);
    expect(b.labels).toEqual([]);
    expect(b.id).toBeTruthy();
  });
});
