import { describe, it, expect, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useKanban } from './kanban';
import { createStarterBoard } from '../utils';

const card = (id: string, title: string, labelIds: string[] = []) => ({
  id, title, description: '', labelIds, dueDate: null, subtasks: [], createdAt: '', updatedAt: '',
});

beforeEach(() => { localStorage.clear(); setActivePinia(createPinia()); });

describe('store core', () => {
  it('seeds a starter board on first run', () => {
    const s = useKanban();
    expect(s.boards).toHaveLength(1);
    expect(s.activeBoard).not.toBeNull();
    expect(s.activeBoard?.columns).toHaveLength(3);
  });

  it('isOverWip flags count > limit only', () => {
    const s = useKanban();
    const col = s.activeBoard!.columns[0];
    col.wipLimit = 1;
    expect(s.isOverWip(col)).toBe(false);
    col.cards.push(card('a', 'a'));
    expect(s.isOverWip(col)).toBe(false);
    col.cards.push(card('b', 'b'));
    expect(s.isOverWip(col)).toBe(true);
  });

  it('filteredCards: query substring (case-insensitive) AND label OR', () => {
    const s = useKanban();
    const board = s.activeBoard!;
    const col = board.columns[0];
    board.labels.push({ id: 'L1', name: 'Bug', tint: 'salmon' });
    col.cards = [
      card('c1', 'Fix login', ['L1']),
      card('c2', 'Write docs'),
    ];
    s.filters.query = 'login';
    expect(s.filteredCards(board.id, col.id).map(c => c.id)).toEqual(['c1']);
    s.filters.query = '';
    s.filters.labelIds = ['L1'];
    expect(s.filteredCards(board.id, col.id).map(c => c.id)).toEqual(['c1']);
    s.filters.labelIds = [];
    expect(s.filteredCards(board.id, col.id)).toHaveLength(2);
  });

  it('boots from persisted storage', () => {
    const b = createStarterBoard('Saved');
    localStorage.setItem('kanbango:v1', JSON.stringify({ version: 1, boards: [b], activeBoardId: b.id }));
    const s = useKanban();
    expect(s.boards[0].name).toBe('Saved');
  });

  it('persists synchronously on mutation (same tick)', () => {
    const s = useKanban();
    s.boards[0].name = 'Renamed';
    const raw = JSON.parse(localStorage.getItem('kanbango:v1')!);
    expect(raw.boards[0].name).toBe('Renamed');
  });
});
