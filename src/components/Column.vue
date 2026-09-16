<script setup lang="ts">
import { ref, computed } from 'vue';
import type { Column } from '../types';
import { useKanban } from '../stores/kanban';

const props = defineProps<{ boardId: string; column: Column }>();
const store = useKanban();

const draft = ref('');
const overWip = computed(() => store.isOverWip(props.column));

function quickAdd() {
  const title = draft.value.trim();
  if (title) {
    store.addCard(props.boardId, props.column.id, title);
    draft.value = '';
  }
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

    <ul class="card-list">
      <li v-for="card in column.cards" :key="card.id" class="ribbon-card card">
        <div class="ribbon-card-body" :class="`ribbon-card-body-${column.tint}`">
          {{ card.title }}
        </div>
      </li>
      <p v-if="column.cards.length === 0" class="column-empty">ADD CARD</p>
    </ul>

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
  list-style: none; margin: 0; padding: var(--sp-sm);
  border: var(--border); border-top: none;
  display: flex; flex-direction: column; gap: var(--sp-sm);
  min-height: 64px;
}
.card { margin: 0; }
.column-empty { text-align: center; font-style: italic; padding: var(--sp-sm) 0; }
.column-add { display: flex; gap: var(--sp-sm); margin-top: var(--sp-sm); }
</style>
