<script setup lang="ts">
import { watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import Column from '../components/Column.vue';
import { useKanban } from '../stores/kanban';

const route = useRoute();
const router = useRouter();
const store = useKanban();

// Route guard: keep the store in sync with the URL; repair bad ids.
watch(
  () => route.params.boardId,
  (id) => {
    if (typeof id === 'string' && store.boards.some((b) => b.id === id)) {
      store.setActiveBoard(id);
      return;
    }
    router.replace('/');
  },
  { immediate: true },
);
</script>

<template>
  <div v-if="store.activeBoard" class="board-page">
    <div class="board-columns">
      <Column
        v-for="col in store.activeBoard.columns"
        :key="col.id"
        :board-id="store.activeBoard.id"
        :column="col"
      />
    </div>
  </div>
  <p v-else class="empty-state">NO BOARD FOUND.</p>
</template>

<style scoped>
.board-columns {
  display: flex; align-items: flex-start; gap: var(--sp-lg);
  overflow-x: auto; padding-bottom: var(--sp-md);
}
</style>
