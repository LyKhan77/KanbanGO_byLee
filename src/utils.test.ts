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
    const pinned = Date.UTC(2026, 8, 15, 22, 30, 0); // 2026-09-15T22:30Z; local date differs from UTC in most zones
    vi.useFakeTimers({ now: pinned });
    const d = new Date(pinned);
    const p = (n: number) => String(n).padStart(2, '0');
    expect(todayISO()).toBe(`${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`);
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
