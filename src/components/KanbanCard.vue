<script setup lang="ts">
import { computed } from 'vue';
import type { Card, Column } from '../types';
import { useKanban } from '../stores/kanban';
import { isOverdue } from '../utils';

const props = defineProps<{ boardId: string; card: Card; column: Column }>();
const emit = defineEmits<{ open: [] }>();
const store = useKanban();

const board = computed(() => store.findBoard(props.boardId));
const labels = computed(() =>
  props.card.labelIds
    .map((id) => board.value.labels.find((l) => l.id === id))
    .filter((l): l is NonNullable<typeof l> => l != null),
);
const doneCount = computed(() => props.card.subtasks.filter((s) => s.done).length);
const overdue = computed(() => isOverdue(props.card.dueDate));
</script>

<template>
  <article class="ribbon-card kanban-card">
    <button class="card-title ribbon-card-title" @click="emit('open')">
      {{ card.title }}
    </button>
    <div class="card-body ribbon-card-body" :class="`ribbon-card-body-${column.tint}`">
      <div v-if="labels.length" class="card-labels">
        <span
          v-for="l in labels"
          :key="l.id"
          class="label-chip"
          :class="`label-chip-${l.tint}`"
        >{{ l.name }}</span>
      </div>
      <div class="card-foot">
        <span v-if="card.dueDate" class="due" :class="{ 'due-overdue': overdue }">
          due {{ card.dueDate }}
        </span>
        <span v-if="card.subtasks.length" class="subtask-count">
          {{ doneCount }}/{{ card.subtasks.length }}
        </span>
        <span v-if="overdue" class="new-burst-sticker">OVERDUE</span>
      </div>
    </div>
  </article>
</template>

<style scoped>
.kanban-card { cursor: grab; }
.kanban-card:active { cursor: grabbing; }
/* visible drag handle (spec §7): the ribbon title bar is the grip; whole card draggable */
.card-title {
  display: block; width: 100%; text-align: left; cursor: grab;
  border-bottom: 2px dotted var(--c-ink);
}
.kanban-card:active .card-title { cursor: grabbing; }
.card-title:hover { background: var(--c-yellow); }
.card-body { display: flex; flex-direction: column; gap: 4px; padding: 8px; }
.card-labels { display: flex; flex-wrap: wrap; gap: 4px; }
.card-foot {
  display: flex; gap: 8px; align-items: center; flex-wrap: wrap;
  margin-top: 4px; font-size: 12px;
}
/* overdue = bold + yellow (never red — design rule) */
.due-overdue { font-weight: 700; background: var(--c-yellow); padding: 0 4px; }
.subtask-count { font-family: var(--font-ui); font-weight: 700; }
</style>
