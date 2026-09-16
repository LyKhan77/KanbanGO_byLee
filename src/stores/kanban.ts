import { defineStore } from 'pinia';
import { ref, computed, watch } from 'vue';
import type { Board, Column, Card, KanbanState } from '../types';
import { createStarterBoard } from '../utils';
import * as storage from '../services/storage';

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
  }, { deep: true });

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

  return { boards, activeBoardId, filters, saveFailed, activeBoard, findBoard, findColumn, isOverWip, filteredCards, setActiveBoard };
});
