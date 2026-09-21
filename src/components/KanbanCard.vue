<script setup lang="ts">
import { computed, ref } from 'vue';
import type { Card, Column } from '../types';
import { useKanban } from '../stores/kanban';
import { isOverdue } from '../utils';

const props = withDefaults(
  defineProps<{
    boardId: string;
    card: Card;
    column: Column;
    showReorder?: boolean;
    isFirst?: boolean;
    isLast?: boolean;
  }>(),
  { showReorder: false, isFirst: true, isLast: true },
);
const emit = defineEmits<{ open: []; 'move-up': []; 'move-down': [] }>();
const store = useKanban();

const board = computed(() => store.findBoard(props.boardId));
const labels = computed(() =>
  props.card.labelIds
    .map((id) => board.value.labels.find((l) => l.id === id))
    .filter((l): l is NonNullable<typeof l> => l != null),
);
const doneCount = computed(() => props.card.subtasks.filter((s) => s.done).length);
const overdue = computed(() => isOverdue(props.card.dueDate));
const expanded = ref(false); // not persisted — YAGNI until someone wants it
</script>

<template>
  <article class="ribbon-card kanban-card">
    <div class="card-title-bar ribbon-card-title">
      <button class="card-title" @click="emit('open')">{{ card.title }}</button>
      <div v-if="showReorder" class="card-reorder">
        <button
          type="button"
          class="reorder-btn"
          :disabled="isFirst"
          :aria-label="`Move '${card.title}' up`"
          @click="emit('move-up')"
        >▲</button>
        <button
          type="button"
          class="reorder-btn"
          :disabled="isLast"
          :aria-label="`Move '${card.title}' down`"
          @click="emit('move-down')"
        >▼</button>
      </div>
    </div>
    <div class="card-body ribbon-card-body" :class="`ribbon-card-body-${column.tint}`">
      <div v-if="labels.length" class="card-labels">
        <span
          v-for="l in labels"
          :key="l.id"
          class="label-chip"
          :class="`label-chip-${l.tint}`"
        >{{ l.name }}</span>
      </div>
      <p v-if="expanded && card.description" class="card-desc">{{ card.description }}</p>
      <div class="card-foot">
        <span v-if="card.dueDate" class="due" :class="{ 'due-overdue': overdue }">
          due {{ card.dueDate }}
        </span>
        <span v-if="card.subtasks.length" class="subtask-count">
          {{ doneCount }}/{{ card.subtasks.length }}
        </span>
        <span v-if="overdue" class="new-burst-sticker">OVERDUE</span>
        <button
          v-if="card.description"
          type="button"
          class="button-text-link card-more"
          @click="expanded = !expanded"
        >
          {{ expanded ? 'LESS' : 'MORE' }}
        </button>
      </div>
    </div>
  </article>
</template>

<style scoped>
.kanban-card { cursor: default; }
.card-title-bar {
  display: flex; align-items: center; gap: 4px;
  padding: 6px 4px 6px 12px;
}
/* visible drag handle (spec §7): only the title starts a drag (handle=".card-title"
   on the parent <draggable>) — this keeps the reorder buttons and card body
   safely clickable/selectable instead of fighting the drag gesture. */
.card-title {
  flex: 1; min-width: 0;
  background: none; border: none; padding: 0;
  display: block; text-align: left; cursor: grab;
  font-family: inherit; font-weight: inherit; font-size: inherit; text-transform: none;
  border-bottom: 2px dotted var(--c-ink);
}
.card-title:active { cursor: grabbing; }
/* neutral hover — yellow is reserved for sticker chrome (OVERDUE / OVER! / NEW) */
.card-title:hover { outline: 2px solid var(--c-ink); outline-offset: -2px; }
.card-reorder { display: flex; flex-direction: column; gap: 2px; flex: none; }
.reorder-btn {
  width: 24px; height: 24px; padding: 0; line-height: 1;
  background: var(--c-canvas); color: var(--c-ink);
  border: var(--border); border-radius: var(--r-none);
  font-size: 10px; cursor: pointer;
}
.reorder-btn:disabled { color: #999; cursor: not-allowed; }
.card-body { display: flex; flex-direction: column; gap: 4px; padding: 8px; }
.card-labels { display: flex; flex-wrap: wrap; gap: 4px; }
.card-foot {
  display: flex; gap: 8px; align-items: center; flex-wrap: wrap;
  margin-top: 4px; font-size: 12px;
}
/* overdue = bold + yellow (never red — design rule) */
.due-overdue { font-weight: 700; background: var(--c-yellow); padding: 0 4px; }
.subtask-count { font-family: var(--font-ui); font-weight: 700; }
.card-desc {
  font-family: var(--font-body); font-size: 12px; line-height: 1.4;
  white-space: pre-wrap; /* keep line breaks typed in the modal textarea */
}
/* secondary link on a tint surface (P2 fix): classic link-blue fails WCAG AA
   on 5 of 8 tints (measured); ink passes on all 8. */
.card-more { color: var(--c-ink); }
</style>
