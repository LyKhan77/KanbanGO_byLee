import { describe, it, expect, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { mount } from '@vue/test-utils';
import { h, ref, nextTick } from 'vue';
import CardModal from './CardModal.vue';
import { useKanban } from '../stores/kanban';
import type { Column } from '../types';

beforeEach(() => { localStorage.clear(); setActivePinia(createPinia()); });

// Parent mirrors BoardView: closes the modal on close (unmounts CardModal).
function setup() {
  const s = useKanban();
  const b = s.boards[0];
  const colA = b.columns[0];
  const colB: Column = { id: 'colB', title: 'Done here', tint: 'sage', wipLimit: null, cards: [] };
  b.columns.push(colB);
  colA.cards.push({
    id: 'c1', title: 'Task', description: '', labelIds: [], dueDate: null,
    subtasks: [], createdAt: '', updatedAt: '',
  });
  const editing = ref<{ boardId: string; colId: string; cardId: string } | null>({
    boardId: b.id, colId: colA.id, cardId: 'c1',
  });
  const wrapper = mount(() => {
    const e = editing.value;
    return e ? h(CardModal, { ...e, onClose: () => { editing.value = null; } }) : null;
  });
  return { s, b, colA, colB, editing, wrapper };
}

describe('CardModal MOVE TO (cluster C)', () => {
  it('moves the card to the selected column, appended at the end', async () => {
    const { colA, colB, wrapper } = setup();
    await wrapper.find('select[aria-label="move to column"]').setValue('colB');
    expect(colA.cards).toHaveLength(0);
    expect(colB.cards.map((c) => c.id)).toEqual(['c1']);
  });

  it('ignores selecting the column the card is already in', async () => {
    const { b, colA, wrapper } = setup();
    const sel = wrapper.find('select[aria-label="move to column"]');
    expect((sel.element as HTMLSelectElement).value).toBe(colA.id);
    await sel.setValue(colA.id);
    expect(colA.cards).toHaveLength(1);
    expect(b.columns).toHaveLength(4); // 3 starter + colB
  });

  it('delete still works after a move (stale colId prop does not silently no-op)', async () => {
    const { colB, editing, wrapper } = setup();
    await wrapper.find('select[aria-label="move to column"]').setValue('colB');
    await wrapper.find('button.button-text-link').trigger('click');
    await nextTick();
    await wrapper.find('.confirm-card .button-primary').trigger('click');
    expect(colB.cards).toHaveLength(0);
    expect(editing.value).toBeNull(); // modal closed
  });
});
