import { describe, it, expect, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { mount } from '@vue/test-utils';
import KanbanCard from './KanbanCard.vue';
import { useKanban } from '../stores/kanban';

beforeEach(() => { localStorage.clear(); setActivePinia(createPinia()); });

function renderCard(description: string) {
  const s = useKanban();
  const b = s.boards[0];
  const col = b.columns[0];
  col.cards.push({
    id: 'c1', title: 'Task', description, labelIds: [], dueDate: null,
    subtasks: [], createdAt: '', updatedAt: '',
  });
  return mount(KanbanCard, { props: { boardId: b.id, card: col.cards[0], column: col } });
}

describe('KanbanCard expand/hide description', () => {
  it('MORE reveals the description, LESS hides it', async () => {
    const w = renderCard('some details here');
    expect(w.find('.card-desc').exists()).toBe(false);
    expect(w.find('.card-more').text()).toBe('MORE');
    await w.find('.card-more').trigger('click');
    expect(w.find('.card-desc').text()).toBe('some details here');
    expect(w.find('.card-more').text()).toBe('LESS');
    await w.find('.card-more').trigger('click');
    expect(w.find('.card-desc').exists()).toBe(false);
  });

  it('has no expand control when the description is empty', () => {
    const w = renderCard('');
    expect(w.find('.card-more').exists()).toBe(false);
    expect(w.find('.card-desc').exists()).toBe(false);
  });
});
