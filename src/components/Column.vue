<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { VueDraggableNext as draggable } from 'vue-draggable-next';
import type { DragChangeEvent } from 'vue-draggable-next';
import type { Card, Column, TintKey } from '../types';
import { TINTS } from '../types';
import KanbanCard from './KanbanCard.vue';
import ConfirmDialog from './ConfirmDialog.vue';
import { useKanban } from '../stores/kanban';

const props = defineProps<{ boardId: string; column: Column }>();
const emit = defineEmits<{ 'open-card': [colId: string, cardId: string] }>();
const store = useKanban();

const draft = ref('');
const menuOpen = ref(false);
const renameDraft = ref(props.column.title);
const wipDraft = ref('');

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

// Header count freezes during an active drag (P0 fix): SortableJS reorders
// the DOM live but only settles `column.cards` on drop, so reading the count
// reactively mid-drag showed numbers that contradicted what was on screen.
const dragging = ref(false);
const displayCount = ref(props.column.cards.length);
watch(
  () => props.column.cards.length,
  (n) => { if (!dragging.value) displayCount.value = n; },
);
function onDragStart() {
  dragging.value = true;
}
function onDragEnd() {
  dragging.value = false;
  displayCount.value = props.column.cards.length;
}

// Records what SortableJS just did so it stays undoable (store.lastMove) —
// drag mutates `column.cards` directly, so this is evidence, not the mutation.
function onDragChange(evt: DragChangeEvent<Card>) {
  if (evt.added) {
    store.recordCardAdded(
      props.boardId, props.column.id, evt.added.element.id, evt.added.newIndex, evt.added.element.title,
    );
  } else if (evt.removed) {
    store.recordCardRemoved(props.boardId, props.column.id, evt.removed.element.id, evt.removed.oldIndex);
  } else if (evt.moved) {
    store.recordCardReordered(
      props.boardId, props.column.id, evt.moved.element.id,
      evt.moved.oldIndex, evt.moved.newIndex, evt.moved.element.title,
    );
  }
}

function openCard(cardId: string) {
  emit('open-card', props.column.id, cardId);
}

// Keyboard reorder (P0 fix): move-up/down buttons on every card need no drag
// at all. Cross-column moves stay covered by the modal's MOVE TO select.
function moveCardUp(cardId: string) {
  const i = props.column.cards.findIndex((c) => c.id === cardId);
  if (i <= 0) return;
  store.moveCard(props.boardId, props.column.id, cardId, props.column.id, i - 1);
}
function moveCardDown(cardId: string) {
  const i = props.column.cards.findIndex((c) => c.id === cardId);
  if (i === -1 || i >= props.column.cards.length - 1) return;
  store.moveCard(props.boardId, props.column.id, cardId, props.column.id, i + 1);
}

function saveRename() {
  const t = renameDraft.value.trim();
  if (t) store.renameColumn(props.boardId, props.column.id, t);
}

function setTint(t: TintKey) {
  store.setColumnTint(props.boardId, props.column.id, t);
}

function setWip() {
  const n = parseInt(wipDraft.value, 10);
  store.setWipLimit(props.boardId, props.column.id, Number.isFinite(n) ? n : null);
  wipDraft.value = '';
}

function clearWip() {
  store.setWipLimit(props.boardId, props.column.id, null);
}

const confirmOpen = ref(false);
const deleteMessage = computed(
  () => `Delete column "${props.column.title}" and its ${props.column.cards.length} card(s)?`,
);

function delColumn() {
  confirmOpen.value = true;
}

function doDeleteColumn() {
  store.deleteColumn(props.boardId, props.column.id);
  confirmOpen.value = false;
}
</script>

<template>
  <section class="column">
    <header class="column-header" :class="`section-eyebrow-${column.tint}`">
      <span class="column-title">{{ column.title }}</span>
      <span class="column-count">
        {{ displayCount }}<template v-if="column.wipLimit != null">/{{ column.wipLimit }}</template>
      </span>
      <span v-if="overWip" class="new-burst-sticker">OVER!</span>
      <button type="button" class="menu-toggle" @click="menuOpen = !menuOpen">
        {{ menuOpen ? 'CLOSE' : 'MENU' }}
      </button>
    </header>

    <div v-if="menuOpen" class="column-menu">
      <div class="menu-row">
        <input class="text-input" v-model="renameDraft" placeholder="column title" aria-label="column title" />
        <button type="button" class="button-secondary" @click="saveRename">RENAME</button>
      </div>
      <div class="menu-row">
        <select
          class="text-input"
          :value="column.tint"
          @change="setTint(($event.target as HTMLSelectElement).value as TintKey)"
        >
          <option v-for="t in TINTS" :key="t" :value="t">{{ t }}</option>
        </select>
        <span class="tint-swatch" :class="`tint-swatch-${column.tint}`" :title="`tint: ${column.tint}`"></span>
      </div>
      <div class="menu-row">
        <input class="text-input" v-model="wipDraft" type="number" min="1" placeholder="WIP limit" aria-label="WIP limit" />
        <button type="button" class="button-secondary" @click="setWip">SET</button>
        <button v-if="column.wipLimit != null" type="button" class="button-text-link" @click="clearWip">
          CLEAR
        </button>
      </div>
      <div class="menu-row">
        <button type="button" class="button-text-link" @click="delColumn">DELETE COLUMN</button>
      </div>
    </div>

    <draggable
      v-if="!filtersActive"
      class="card-list"
      :list="column.cards"
      group="kanban"
      item-key="id"
      handle=".card-title"
      :distance="4"
      @start="onDragStart"
      @end="onDragEnd"
      @change="onDragChange"
    >
      <KanbanCard
        v-for="(card, idx) in column.cards"
        :key="card.id"
        :board-id="boardId"
        :card="card"
        :column="column"
        :show-reorder="true"
        :is-first="idx === 0"
        :is-last="idx === column.cards.length - 1"
        @open="openCard(card.id)"
        @move-up="moveCardUp(card.id)"
        @move-down="moveCardDown(card.id)"
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
    <p v-else-if="filtersActive && visibleCards.length === 0" class="column-empty">
      no matching cards
    </p>

    <div class="column-add">
      <input
        class="text-input"
        v-model="draft"
        placeholder="add a card…"
        aria-label="add a card"
        @keyup.enter="quickAdd"
      />
      <button class="button-secondary" @click="quickAdd">ADD</button>
    </div>
    <ConfirmDialog
      v-if="confirmOpen"
      :message="deleteMessage"
      @confirm="doDeleteColumn"
      @cancel="confirmOpen = false"
    />
  </section>
</template>

<style scoped>
.column { width: 260px; flex-shrink: 0; }
.column-header {
  display: flex; align-items: center; gap: var(--sp-sm);
  font-size: 16px; padding: 10px var(--sp-md);
  position: sticky; top: 0; z-index: 2;
}
.column-title { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.column-count {
  font-family: var(--font-ui); font-weight: 700; font-size: 12px;
  background: var(--c-canvas); border: var(--border);
  padding: 2px 6px;
}
.menu-toggle {
  background: var(--c-canvas); border: var(--border);
  font-family: var(--font-ui); font-weight: 700; font-size: 11px;
  padding: 2px 6px; cursor: pointer;
}
.column-menu {
  border: var(--border); border-top: none;
  padding: var(--sp-sm);
  display: flex; flex-direction: column; gap: var(--sp-xs);
}
.menu-row { display: flex; gap: var(--sp-xs); align-items: center; }
.menu-row .text-input { flex: 1; min-width: 0; }
.card-list {
  border: var(--border); border-top: none;
  padding: var(--sp-sm);
  display: flex; flex-direction: column; gap: var(--sp-sm);
  min-height: 64px;
}
.card-list.filtered { padding-bottom: 0; }
.filter-note { font-style: italic; font-size: 12px; margin: 4px 0 0; }
.column-empty {
  text-align: center; font-style: italic; font-size: 12px;
  border: var(--border); border-top: none;
  padding: var(--sp-sm) 0; margin: 0;
}
.column-add { display: flex; gap: var(--sp-sm); margin-top: var(--sp-sm); }
</style>
