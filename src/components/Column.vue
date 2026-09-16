<script setup lang="ts">
import { ref, computed } from 'vue';
// vue-draggable-next 2.3.0 ships named exports only (no default) — see task-11 report.
import { VueDraggableNext as draggable } from 'vue-draggable-next';
import type { Column } from '../types';
import KanbanCard from './KanbanCard.vue';
import { useKanban } from '../stores/kanban';

const props = defineProps<{ boardId: string; column: Column }>();
const emit = defineEmits<{ 'open-card': [colId: string, cardId: string] }>();
const store = useKanban();

const draft = ref('');
const overWip = computed(() => store.isOverWip(props.column));
const filtersActive = computed(
  () => store.filters.query.trim() !== '' || store.filters.labelIds.length > 0,
);
const visibleCards = computed(() => store.filteredCards(props.boardId, props.column.id));

function quickAdd() {
  const title = draft.value.trim();
  if (title) {
    store.addCard(props.boardId, props.column.id, title);
    draft.value = '';
  }
}

function onDragChange() {
  // SortableJS already mutated column.cards in place; bump updatedAt.
  store.touchBoard(props.boardId);
}

function openCard(cardId: string) {
  emit('open-card', props.column.id, cardId);
}
</script>

<template>
  <section class="column">
    <header class="column-header" :class="`section-eyebrow-${column.tint}`">
      <span class="column-title">{{ column.title }}</span>
      <span class="column-count">
        {{ column.cards.length }}<template v-if="column.wipLimit != null">/{{ column.wipLimit }}</template>
      </span>
      <span v-if="overWip" class="new-burst-sticker">OVER!</span>
    </header>

    <draggable
      v-if="!filtersActive"
      class="card-list"
      :list="column.cards"
      group="kanban"
      item-key="id"
      @change="onDragChange"
    >
      <KanbanCard
        v-for="card in column.cards"
        :key="card.id"
        :board-id="boardId"
        :card="card"
        :column="column"
        @open="openCard(card.id)"
      />
    </draggable>
    <template v-else>
      <p class="filter-note">filters active — drag &amp; drop disabled</p>
      <div class="card-list filtered">
        <KanbanCard
          v-for="card in visibleCards"
          :key="card.id"
          :board-id="boardId"
          :card="card"
          :column="column"
          @open="openCard(card.id)"
        />
      </div>
    </template>

    <p v-if="!filtersActive && column.cards.length === 0" class="column-empty">ADD CARD</p>
    <p v-else-if="filtersActive && visibleCards.length === 0" class="column-empty">no matching cards</p>

    <div class="column-add">
      <input
        class="text-input"
        v-model="draft"
        placeholder="add a card…"
        @keyup.enter="quickAdd"
      />
      <button class="button-secondary" @click="quickAdd">ADD</button>
    </div>
  </section>
</template>

<style scoped>
.column { width: 260px; flex-shrink: 0; }
.column-header {
  display: flex; align-items: center; gap: var(--sp-sm);
  font-size: 16px; padding: 10px var(--sp-md);
}
.column-title { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.column-count {
  font-family: var(--font-ui); font-weight: 700; font-size: 12px;
  background: var(--c-canvas); border: var(--border);
  padding: 2px 6px;
}
.card-list {
  border: var(--border); border-top: none;
  padding: var(--sp-sm);
  display: flex; flex-direction: column; gap: var(--sp-sm);
  min-height: 64px;
}
.card-list.filtered { padding-bottom: 0; }
.filter-note { font-style: italic; font-size: 12px; margin: 4px 0 0; }
.column-empty { text-align: center; font-style: italic; padding: var(--sp-sm) 0; }
.column-add { display: flex; gap: var(--sp-sm); margin-top: var(--sp-sm); }
</style>
