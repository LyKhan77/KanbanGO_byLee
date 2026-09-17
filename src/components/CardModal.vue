<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import { useKanban } from '../stores/kanban';
import { isOverdue } from '../utils';
import LabelPicker from './LabelPicker.vue';
import SubtaskList from './SubtaskList.vue';
import ConfirmDialog from './ConfirmDialog.vue';

const props = defineProps<{ boardId: string; colId: string; cardId: string }>();
const emit = defineEmits<{ close: [] }>();
const store = useKanban();

// Remember where focus came from so it can go back when the modal closes.
let previouslyFocused: HTMLElement | null = null;
const titleInput = ref<HTMLInputElement>();
onMounted(() => {
  previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  // HTML autofocus is ignored on dynamically rendered elements — focus explicitly.
  titleInput.value?.focus();
});
onBeforeUnmount(() => {
  previouslyFocused?.focus();
});

const card = computed(() => store.findCard(props.boardId, props.cardId));
const title = ref(card.value.title);
const description = ref(card.value.description);
const dueDate = ref<string | null>(card.value.dueDate);

function save() {
  const t = title.value.trim();
  store.updateCard(props.boardId, props.cardId, {
    title: t || 'Untitled',
    description: description.value,
    dueDate: dueDate.value,
  });
  emit('close');
}

const confirmOpen = ref(false);

function remove() {
  confirmOpen.value = true;
}

function doDelete() {
  store.deleteCard(props.boardId, props.colId, props.cardId);
  confirmOpen.value = false;
  emit('close');
}

function toggleLabel(labelId: string) {
  const cur = card.value.labelIds;
  const next = cur.includes(labelId)
    ? cur.filter((x) => x !== labelId)
    : [...cur, labelId];
  store.updateCard(props.boardId, props.cardId, { labelIds: next });
}
</script>

<template>
  <div class="modal-backdrop" @click.self="emit('close')" @keydown.esc="emit('close')">
    <div class="modal-card" role="dialog" aria-modal="true" aria-label="Edit card">
      <header class="ribbon-card-title">EDIT CARD</header>
      <div class="modal-body">
        <label class="field">
          <span class="field-label">TITLE</span>
          <input ref="titleInput" class="text-input" v-model="title" />
        </label>
        <label class="field">
          <span class="field-label">DESCRIPTION</span>
          <textarea class="text-input" v-model="description" rows="3"></textarea>
        </label>
        <label class="field">
          <span class="field-label">DUE DATE</span>
          <input
            class="text-input"
            type="date"
            :value="dueDate ?? ''"
            @input="dueDate = ($event.target as HTMLInputElement).value || null"
          />
        </label>
        <div class="field">
          <span class="field-label">LABELS</span>
          <LabelPicker
            :board-id="boardId"
            :selected="card.labelIds"
            @toggle="toggleLabel"
          />
        </div>
        <div class="field">
          <span class="field-label">SUBTASKS</span>
          <SubtaskList :board-id="boardId" :card-id="cardId" />
        </div>
      </div>
      <footer class="modal-foot">
        <span v-if="isOverdue(card.dueDate)" class="new-burst-sticker">OVERDUE</span>
        <span class="spacer" />
        <button class="button-secondary" @click="emit('close')">CANCEL</button>
        <button class="button-text-link" @click="remove">DELETE CARD</button>
        <button class="button-primary" @click="save">SAVE</button>
      </footer>
    </div>
    <ConfirmDialog
      v-if="confirmOpen"
      message="Delete this card? This cannot be undone."
      @confirm="doDelete"
      @cancel="confirmOpen = false"
    />
  </div>
</template>

<style scoped>
.modal-body { display: flex; flex-direction: column; gap: var(--sp-md); padding: var(--sp-lg); }
.field { display: flex; flex-direction: column; gap: 4px; }
.field-label {
  font-family: var(--font-ui); font-weight: 700; font-size: 11px;
  text-transform: uppercase;
}
.modal-foot {
  display: flex; gap: var(--sp-md); align-items: center;
  border-top: var(--border);
  padding: var(--sp-md) var(--sp-lg);
}
.spacer { flex: 1; }
</style>
