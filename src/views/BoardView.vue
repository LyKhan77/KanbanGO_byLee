<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import Column from '../components/Column.vue';
import CardModal from '../components/CardModal.vue';
import { useKanban } from '../stores/kanban';

const route = useRoute();
const router = useRouter();
const store = useKanban();

const editingCard = ref<{ boardId: string; colId: string; cardId: string } | null>(null);

const filtersActive = computed(
  () => store.filters.query.trim() !== '' || store.filters.labelIds.length > 0,
);

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

function toggleFilterLabel(labelId: string) {
  const cur = store.filters.labelIds;
  store.filters.labelIds = cur.includes(labelId)
    ? cur.filter((x) => x !== labelId)
    : [...cur, labelId];
}

function clearFilters() {
  store.filters.query = '';
  store.filters.labelIds = [];
}
</script>

<template>
  <div v-if="store.activeBoard" class="board-page">
    <div class="board-toolbar">
      <input
        class="text-input toolbar-search"
        v-model="store.filters.query"
        placeholder="search cards…"
        aria-label="search cards"
      />
      <div v-if="store.activeBoard.labels.length" class="toolbar-labels">
        <button
          v-for="l in store.activeBoard.labels"
          :key="l.id"
          type="button"
          class="label-chip chip-toggle"
          :class="[`label-chip-${l.tint}`, { 'chip-active': store.filters.labelIds.includes(l.id) }]"
          @click="toggleFilterLabel(l.id)"
        >{{ l.name }}</button>
      </div>
      <button v-if="filtersActive" type="button" class="button-text-link" @click="clearFilters">
        CLEAR FILTERS
      </button>
    </div>

    <p v-if="store.activeBoard.columns.length === 0" class="empty-state">
      NO COLUMNS YET — USE "+ ADD COLUMN" IN THE BANNER ABOVE.
    </p>

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
.board-toolbar {
  display: flex; gap: var(--sp-md); align-items: center; flex-wrap: wrap;
  margin-bottom: var(--sp-lg);
}
.toolbar-search { width: 240px; }
.toolbar-labels { display: flex; gap: var(--sp-xs); flex-wrap: wrap; }
.chip-toggle { cursor: pointer; }
.chip-active { outline: 2px solid var(--c-ink); outline-offset: 1px; }
.board-columns {
  display: flex; align-items: flex-start; gap: var(--sp-lg);
  overflow-x: auto; padding-bottom: var(--sp-md);
}
</style>
