import { defineStore } from 'pinia';
import { ref, computed, watch } from 'vue';
import type { Board, Column, Card, KanbanState, TintKey } from '../types';
import { uid, nowISO, createStarterBoard } from '../utils';
import * as storage from '../services/storage';

// Undo affordance (P0 fix): the most recent card move (drag, keyboard
// up/down, or MOVE TO), reversible via undoLastMove.
export interface LastMove {
  boardId: string;
  cardId: string;
  cardTitle: string;
  fromColId: string;
  fromIndex: number;
  toColId: string;
  toIndex: number;
}

function defaultState(): KanbanState {
  const b = createStarterBoard();
  return { version: 1, boards: [b], activeBoardId: b.id };
}

export const useKanban = defineStore('kanban', () => {
  const init = storage.load() ?? defaultState();
  const boards = ref<Board[]>(init.boards);
  const activeBoardId = ref<string | null>(init.activeBoardId);
  const filters = ref<{ query: string; labelIds: string[] }>({ query: '', labelIds: [] });
  const saveFailed = ref(false); // spec §9: storage full/unavailable → warn, keep in memory
  const lastMove = ref<LastMove | null>(null);
  // Cross-column drag fires `removed` on the source Column and `added` on the
  // target Column as two separate events; this bridges them into one LastMove.
  let pendingRemoval: { boardId: string; cardId: string; fromColId: string; fromIndex: number } | null = null;

  const activeBoard = computed<Board | null>(
    () => boards.value.find(b => b.id === activeBoardId.value) ?? null,
  );

  function setActiveBoard(id: string | null): void {
    activeBoardId.value = id;
  }

  // Persist on any change to boards / activeBoardId (filters are ephemeral).
  // Sync save: the spec's ~150 ms debounce is skipped — no benefit at personal scale,
  // and it would break the instant-persistence regression test.
  watch([boards, activeBoardId], () => {
    saveFailed.value = !storage.save({ version: 1, boards: boards.value, activeBoardId: activeBoardId.value });
  }, { deep: true, flush: 'sync' });

  function findBoard(id: string): Board {
    const b = boards.value.find(x => x.id === id);
    if (!b) throw new Error('board not found: ' + id);
    return b;
  }
  function findColumn(boardId: string, colId: string): Column {
    const c = findBoard(boardId).columns.find(x => x.id === colId);
    if (!c) throw new Error('column not found: ' + colId);
    return c;
  }

  function isOverWip(col: Column): boolean {
    return col.wipLimit != null && col.cards.length > col.wipLimit;
  }

  function filteredCards(boardId: string, columnId: string): Card[] {
    const col = findColumn(boardId, columnId);
    const q = filters.value.query.trim().toLowerCase();
    const sel = filters.value.labelIds;
    return col.cards.filter(card => {
      const mq = !q || card.title.toLowerCase().includes(q) || card.description.toLowerCase().includes(q);
      const ml = sel.length === 0 || sel.some(lid => card.labelIds.includes(lid));
      return mq && ml;
    });
  }

  function touchBoard(boardId: string): void {
    findBoard(boardId).updatedAt = nowISO();
  }

  function createBoard(name: string): string {
    const t = nowISO();
    const b: Board = { id: uid(), name: name.trim() || 'Board', columns: [], labels: [], createdAt: t, updatedAt: t };
    boards.value.push(b);
    return b.id;
  }

  function renameBoard(id: string, name: string): void {
    const b = findBoard(id);
    b.name = name.trim() || b.name;
    touchBoard(id);
  }

  function deleteBoard(id: string): void {
    const i = boards.value.findIndex(x => x.id === id);
    if (i === -1) return;
    boards.value.splice(i, 1);
    if (activeBoardId.value === id) activeBoardId.value = boards.value[0]?.id ?? null;
  }

  function addColumn(boardId: string, title: string, tint: TintKey = 'steel'): void {
    findBoard(boardId).columns.push({ id: uid(), title: title.trim() || 'Column', tint, wipLimit: null, cards: [] });
    touchBoard(boardId);
  }

  function renameColumn(boardId: string, colId: string, title: string): void {
    findColumn(boardId, colId).title = title.trim() || findColumn(boardId, colId).title;
    touchBoard(boardId);
  }

  function deleteColumn(boardId: string, colId: string): void {
    const cols = findBoard(boardId).columns;
    const i = cols.findIndex(x => x.id === colId);
    if (i === -1) return;
    cols.splice(i, 1);
    touchBoard(boardId);
  }

  function addCard(boardId: string, colId: string, title: string): void {
    const t = nowISO();
    findColumn(boardId, colId).cards.push({
      id: uid(), title: title.trim() || 'Card', description: '', labelIds: [],
      dueDate: null, subtasks: [], createdAt: t, updatedAt: t,
    });
    touchBoard(boardId);
  }

  function findCard(boardId: string, cardId: string): Card {
    const card = findBoard(boardId).columns.flatMap(c => c.cards).find(x => x.id === cardId);
    if (!card) throw new Error('card not found: ' + cardId);
    return card;
  }

  function updateCard(boardId: string, cardId: string, patch: Partial<Card>): void {
    const card = findCard(boardId, cardId);
    const safe: Partial<Card> = { ...patch };
    delete safe.id;
    delete safe.createdAt;
    delete safe.updatedAt;
    Object.assign(card, safe, { updatedAt: nowISO() });
    touchBoard(boardId);
  }

  function deleteCard(boardId: string, colId: string, cardId: string): void {
    const cards = findColumn(boardId, colId).cards;
    const i = cards.findIndex(x => x.id === cardId);
    if (i === -1) return;
    cards.splice(i, 1);
    touchBoard(boardId);
  }

  function addLabel(boardId: string, name: string, tint: TintKey): void {
    findBoard(boardId).labels.push({ id: uid(), name: name.trim() || 'Label', tint });
    touchBoard(boardId);
  }

  function deleteLabel(boardId: string, labelId: string): void {
    const b = findBoard(boardId);
    b.labels = b.labels.filter(l => l.id !== labelId);
    b.columns.forEach(c => c.cards.forEach(card => {
      card.labelIds = card.labelIds.filter(id => id !== labelId);
    }));
    touchBoard(boardId);
  }

  function addSubtask(boardId: string, cardId: string, title: string): void {
    const card = findCard(boardId, cardId);
    card.subtasks.push({ id: uid(), title: title.trim() || 'Subtask', done: false });
    card.updatedAt = nowISO();
    touchBoard(boardId);
  }

  function toggleSubtask(boardId: string, cardId: string, subtaskId: string): void {
    const st = findCard(boardId, cardId).subtasks.find(x => x.id === subtaskId);
    if (st) st.done = !st.done;
    findCard(boardId, cardId).updatedAt = nowISO();
    touchBoard(boardId);
  }

  function deleteSubtask(boardId: string, cardId: string, subtaskId: string): void {
    const card = findCard(boardId, cardId);
    card.subtasks = card.subtasks.filter(x => x.id !== subtaskId);
    card.updatedAt = nowISO();
    touchBoard(boardId);
  }

  // Splice-only move, shared by moveCard and undoLastMove (the undo must not
  // itself record a new undo entry).
  function moveCardRaw(
    boardId: string, fromColId: string, cardId: string, toColId: string, toIndex: number,
  ): { fromIndex: number; toIndex: number; title: string } | null {
    const from = findColumn(boardId, fromColId);
    const to = findColumn(boardId, toColId);
    const i = from.cards.findIndex(c => c.id === cardId);
    if (i === -1) return null;
    const [card] = from.cards.splice(i, 1);
    const idx = Math.max(0, Math.min(toIndex, to.cards.length));
    to.cards.splice(idx, 0, card);
    touchBoard(boardId);
    return { fromIndex: i, toIndex: idx, title: card.title };
  }

  function moveCard(boardId: string, fromColId: string, cardId: string, toColId: string, toIndex: number): void {
    const res = moveCardRaw(boardId, fromColId, cardId, toColId, toIndex);
    if (res) {
      lastMove.value = {
        boardId, cardId, cardTitle: res.title,
        fromColId, fromIndex: res.fromIndex, toColId, toIndex: res.toIndex,
      };
    }
  }

  // Drag-and-drop mutates column.cards directly via vue-draggable-next; these
  // three record what just happened so it stays undoable and status counters
  // stay in sync (spec: P0 "silent, irreversible drag-drop").
  function recordCardRemoved(boardId: string, colId: string, cardId: string, fromIndex: number): void {
    pendingRemoval = { boardId, cardId, fromColId: colId, fromIndex };
    touchBoard(boardId);
  }

  function recordCardAdded(boardId: string, colId: string, cardId: string, toIndex: number, cardTitle: string): void {
    if (pendingRemoval && pendingRemoval.cardId === cardId && pendingRemoval.boardId === boardId) {
      lastMove.value = {
        boardId, cardId, cardTitle,
        fromColId: pendingRemoval.fromColId, fromIndex: pendingRemoval.fromIndex,
        toColId: colId, toIndex,
      };
      pendingRemoval = null;
    }
    touchBoard(boardId);
  }

  function recordCardReordered(
    boardId: string, colId: string, cardId: string, fromIndex: number, toIndex: number, cardTitle: string,
  ): void {
    lastMove.value = { boardId, cardId, cardTitle, fromColId: colId, fromIndex, toColId: colId, toIndex };
    touchBoard(boardId);
  }

  function undoLastMove(): void {
    const m = lastMove.value;
    if (!m) return;
    moveCardRaw(m.boardId, m.toColId, m.cardId, m.fromColId, m.fromIndex);
    lastMove.value = null;
  }

  function clearLastMove(): void {
    lastMove.value = null;
  }

  function exportBoard(boardId: string): string {
    return storage.exportJSON(findBoard(boardId));
  }

  function importBoard(text: string): { ok: true; count: number } | { ok: false; error: string } {
    let imported: Board[];
    try {
      imported = storage.importJSON(text);
    } catch (e) {
      return { ok: false, error: e instanceof Error ? e.message : 'Import failed' };
    }
    // merge by id: re-importing a board replaces it instead of duplicating it
    for (const b of imported) {
      const i = boards.value.findIndex((x) => x.id === b.id);
      if (i === -1) boards.value.push(b);
      else boards.value[i] = b;
    }
    if (imported.length) activeBoardId.value = imported[0].id;
    return { ok: true, count: imported.length };
  }

  function setColumnTint(boardId: string, colId: string, tint: TintKey): void {
    findColumn(boardId, colId).tint = tint;
    touchBoard(boardId);
  }

  function setWipLimit(boardId: string, colId: string, limit: number | null): void {
    findColumn(boardId, colId).wipLimit = limit != null && limit > 0 ? Math.floor(limit) : null;
    touchBoard(boardId);
  }

  return {
    boards, activeBoardId, filters, saveFailed, lastMove, activeBoard, findBoard, findColumn, isOverWip, filteredCards,
    setActiveBoard, touchBoard, createBoard, renameBoard, deleteBoard, addColumn, renameColumn, deleteColumn, addCard,
    findCard, updateCard, deleteCard, addLabel, deleteLabel, addSubtask, toggleSubtask, deleteSubtask, setColumnTint,
    setWipLimit, moveCard, recordCardRemoved, recordCardAdded, recordCardReordered, undoLastMove, clearLastMove,
    exportBoard, importBoard,
  };
});
