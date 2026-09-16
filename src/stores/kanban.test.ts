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

describe('store CRUD', () => {
  it('createBoard appends and returns id', () => {
    const s = useKanban();
    const id = s.createBoard('New');
    expect(s.boards).toHaveLength(2);
    expect(s.boards[1].id).toBe(id);
    expect(s.boards[1].name).toBe('New');
  });

  it('renameBoard updates name', () => {
    const s = useKanban();
    s.renameBoard(s.activeBoardId!, 'Renamed');
    expect(s.activeBoard!.name).toBe('Renamed');
  });

  it('deleteBoard removes and re-points activeBoardId', () => {
    const s = useKanban();
    const id = s.createBoard('Second');
    s.deleteBoard(s.activeBoardId!);
    expect(s.boards).toHaveLength(1);
    expect(s.activeBoardId).toBe(id);
  });

  it('addColumn appends a column with the given tint', () => {
    const s = useKanban();
    s.addColumn(s.activeBoardId!, 'REVIEW', 'periwinkle');
    expect(s.activeBoard!.columns).toHaveLength(4);
    expect(s.activeBoard!.columns[3].tint).toBe('periwinkle');
  });

  it('renameColumn / deleteColumn', () => {
    const s = useKanban();
    const bid = s.activeBoardId!;
    const col = s.activeBoard!.columns[0];
    s.renameColumn(bid, col.id, 'BACKLOG');
    expect(s.activeBoard!.columns[0].title).toBe('BACKLOG');
    s.deleteColumn(bid, col.id);
    expect(s.activeBoard!.columns).toHaveLength(2);
  });

  it('addCard / updateCard (id protected) / deleteCard', () => {
    const s = useKanban();
    const bid = s.activeBoardId!;
    const col = s.activeBoard!.columns[0];
    s.addCard(bid, col.id, 'Task A');
    const cardId = col.cards[0].id;
    s.updateCard(bid, cardId, { title: 'Task B', description: 'd', id: 'hijack' as never });
    expect(col.cards[0].title).toBe('Task B');
    expect(col.cards[0].description).toBe('d');
    expect(col.cards[0].id).toBe(cardId);
    s.deleteCard(bid, col.id, cardId);
    expect(col.cards).toHaveLength(0);
  });

  it('deleteLabel cascades out of card.labelIds', () => {
    const s = useKanban();
    const bid = s.activeBoardId!;
    const col = s.activeBoard!.columns[0];
    s.addCard(bid, col.id, 'x');
    s.addLabel(bid, 'Bug', 'salmon');
    const labelId = s.activeBoard!.labels[0].id;
    col.cards[0].labelIds.push(labelId);
    s.deleteLabel(bid, labelId);
    expect(s.activeBoard!.labels).toHaveLength(0);
    expect(col.cards[0].labelIds).toEqual([]);
  });

  it('subtasks: add / toggle / delete', () => {
    const s = useKanban();
    const bid = s.activeBoardId!;
    const col = s.activeBoard!.columns[0];
    s.addCard(bid, col.id, 'x');
    const cardId = col.cards[0].id;
    s.addSubtask(bid, cardId, 'step 1');
    const stId = col.cards[0].subtasks[0].id;
    expect(col.cards[0].subtasks[0].done).toBe(false);
    s.toggleSubtask(bid, cardId, stId);
    expect(col.cards[0].subtasks[0].done).toBe(true);
    s.deleteSubtask(bid, cardId, stId);
    expect(col.cards[0].subtasks).toHaveLength(0);
  });

  it('setWipLimit / setColumnTint', () => {
    const s = useKanban();
    const bid = s.activeBoardId!;
    const col = s.activeBoard!.columns[0];
    s.setWipLimit(bid, col.id, 3);
    expect(col.wipLimit).toBe(3);
    s.setWipLimit(bid, col.id, 0);
    expect(col.wipLimit).toBeNull();
    s.setColumnTint(bid, col.id, 'olive');
    expect(col.tint).toBe('olive');
  });
});
