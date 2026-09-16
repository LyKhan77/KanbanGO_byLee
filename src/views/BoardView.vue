<script setup lang="ts">
import { ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import Column from '../components/Column.vue';
import CardModal from '../components/CardModal.vue';
import { useKanban } from '../stores/kanban';

const route = useRoute();
const router = useRouter();
const store = useKanban();

const editingCard = ref<{ boardId: string; colId: string; cardId: string } | null>(null);

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

function openCard(colId: string, cardId: string) {
  const boardId = store.activeBoardId;
  if (boardId) editingCard.value = { boardId, colId, cardId };
}
</script>

<template>
  <div v-if="store.activeBoard" class="board-page">
    <div class="board-columns">
      <Column
        v-for="col in store.activeBoard.columns"
        :key="col.id"
        :board-id="store.activeBoard.id"
        :column="col"
        @open-card="openCard"
      />
    </div>
    <CardModal
      v-if="editingCard"
      :board-id="editingCard.boardId"
      :col-id="editingCard.colId"
      :card-id="editingCard.cardId"
      @close="editingCard = null"
    />
  </div>
  <p v-else class="empty-state">NO BOARD FOUND.</p>
</template>

<style scoped>
.board-columns {
  display: flex; align-items: flex-start; gap: var(--sp-lg);
  overflow-x: auto; padding-bottom: var(--sp-md);
}
</style>
