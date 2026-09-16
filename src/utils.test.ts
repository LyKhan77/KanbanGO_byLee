import { describe, it, expect } from 'vitest';
import { isOverdue, createStarterBoard } from './utils';

describe('isOverdue', () => {
  it('false for null', () => expect(isOverdue(null, '2026-09-16')).toBe(false));
  it('true when before today', () => expect(isOverdue('2026-01-01', '2026-09-16')).toBe(true));
  it('false when today or future', () => {
    expect(isOverdue('2026-09-16', '2026-09-16')).toBe(false);
    expect(isOverdue('2026-12-31', '2026-09-16')).toBe(false);
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
