<script setup lang="ts">
import { ref, computed } from 'vue';
import { useKanban } from '../stores/kanban';

const props = defineProps<{ boardId: string; cardId: string }>();
const store = useKanban();

const card = computed(() => store.findCard(props.boardId, props.cardId));
const draft = ref('');

function add() {
  const t = draft.value.trim();
  if (t) {
    store.addSubtask(props.boardId, props.cardId, t);
    draft.value = '';
  }
}

function toggle(subtaskId: string) {
  store.toggleSubtask(props.boardId, props.cardId, subtaskId);
}

function del(subtaskId: string) {
  store.deleteSubtask(props.boardId, props.cardId, subtaskId);
}
</script>

<template>
  <div class="subtask-list">
    <ul class="subtask-items">
      <li v-for="s in card.subtasks" :key="s.id" class="subtask">
        <label class="subtask-label">
          <input type="checkbox" :checked="s.done" @change="toggle(s.id)" />
          <span :class="{ 'subtask-done': s.done }">{{ s.title }}</span>
        </label>
        <button type="button" class="button-text-link" @click="del(s.id)">✕</button>
      </li>
    </ul>
    <form class="subtask-add" @submit.prevent="add">
      <input class="text-input" v-model="draft" placeholder="add subtask…" />
      <button type="submit" class="button-secondary">ADD</button>
    </form>
  </div>
</template>

<style scoped>
.subtask-items { list-style: none; margin: 0 0 var(--sp-xs); padding: 0; }
.subtask {
  display: flex; align-items: center; gap: var(--sp-sm);
  padding: 2px 0;
}
.subtask-label { flex: 1; display: flex; align-items: center; gap: var(--sp-sm); }
.subtask-done { text-decoration: line-through; }
.subtask-add { display: flex; gap: var(--sp-xs); }
</style>
