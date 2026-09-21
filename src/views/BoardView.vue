<script setup lang="ts">
import { ref, computed, watch, onBeforeUnmount } from 'vue';
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

// Undo toast (P0 fix): every card move — drag, keyboard up/down, or MOVE TO
// — lands here via store.lastMove. role="status" + aria-live announces the
// move to screen readers too, so this doubles as the move announcement.
const moveToast = computed(() => {
  const m = store.lastMove;
  if (!m) return null;
  try {
    return { ...m, toTitle: store.findColumn(m.boardId, m.toColId).title };
  } catch {
    return null; // target column was deleted since the move — nothing to show
  }
});
let toastTimer: ReturnType<typeof window.setTimeout> | undefined;
watch(
  () => store.lastMove,
  (m) => {
    if (toastTimer) window.clearTimeout(toastTimer);
    if (m) toastTimer = window.setTimeout(() => store.clearLastMove(), 6000);
  },
);
onBeforeUnmount(() => {
  if (toastTimer) window.clearTimeout(toastTimer);
});
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
    <p class="breadcrumb">
      <RouterLink to="/">HOME</RouterLink>
      <span class="crumb-sep">|</span>
      <RouterLink to="/">BOARDS</RouterLink>
      <span class="crumb-sep">|</span>
      <span class="crumb-current">{{ store.activeBoard.name }}</span>
    </p>
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

    <div v-if="moveToast" class="move-toast sticker-yellow" role="status" aria-live="polite">
      <span>"{{ moveToast.cardTitle }}" moved to {{ moveToast.toTitle }}.</span>
      <button type="button" class="button-text-link move-toast-undo" @click="store.undoLastMove()">UNDO</button>
    </div>
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
.breadcrumb {
  font-family: var(--font-ui); font-weight: 700; font-size: 12px;
  margin-bottom: var(--sp-sm);
}
.breadcrumb a { color: var(--c-link); }
.crumb-sep { color: #555; padding: 0 6px; }
.crumb-current { color: var(--c-ink); }
.move-toast {
  position: sticky; left: 0; bottom: var(--sp-lg); z-index: 20;
  display: flex; gap: var(--sp-md); align-items: center;
  width: max-content; margin-top: var(--sp-lg);
}
.move-toast-undo { color: var(--c-ink); }
</style>
