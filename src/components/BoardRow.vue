<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import type { Board } from '../types';
import { useKanban } from '../stores/kanban';
import ConfirmDialog from './ConfirmDialog.vue';

const props = defineProps<{ board: Board }>();
const store = useKanban();
const router = useRouter();

const editing = ref(false);
const draftName = ref(props.board.name);

function open() {
  store.setActiveBoard(props.board.id);
  router.push(`/board/${props.board.id}`);
}

function startRename() {
  draftName.value = props.board.name;
  editing.value = true;
}

function saveRename() {
  const name = draftName.value.trim();
  if (name) store.renameBoard(props.board.id, name);
  editing.value = false;
}

const confirmOpen = ref(false);
const deleteMessage = computed(() => `Delete board "${props.board.name}"? This cannot be undone.`);

function remove() {
  confirmOpen.value = true;
}

function doDelete() {
  store.deleteBoard(props.board.id);
  confirmOpen.value = false;
}

function cardCount(b: Board): number {
  return b.columns.reduce((n, c) => n + c.cards.length, 0);
}
</script>

<template>
  <article class="ribbon-card board-row">
    <header class="ribbon-card-title">
      <button v-if="!editing" class="row-open" @click="open">{{ board.name }}</button>
      <form v-else class="rename-form" @submit.prevent="saveRename">
        <input class="text-input" v-model="draftName" autofocus />
        <button type="submit" class="button-secondary">SAVE</button>
        <button type="button" class="button-text-link" @click="editing = false">CANCEL</button>
      </form>
    </header>
    <div class="ribbon-card-body ribbon-card-body-steel row-body">
      <span>{{ board.columns.length }} columns · {{ cardCount(board) }} cards</span>
      <span>updated {{ new Date(board.updatedAt).toLocaleDateString() }}</span>
      <span class="row-actions">
        <button v-if="!editing" class="button-text-link" @click="startRename">RENAME</button>
        <button class="button-text-link" @click="remove">DELETE</button>
      </span>
    </div>
    <ConfirmDialog
      v-if="confirmOpen"
      :message="deleteMessage"
      @confirm="doDelete"
      @cancel="confirmOpen = false"
    />
  </article>
</template>

<style scoped>
.board-row { margin-bottom: var(--sp-md); }
.row-open {
  background: none; border: none; padding: 0; cursor: pointer;
  font-family: var(--font-ui); font-weight: 700; font-size: 14px;
  text-transform: uppercase;
}
.rename-form { display: flex; gap: 8px; align-items: center; }
.row-body { display: flex; gap: var(--sp-lg); align-items: center; }
.row-actions { margin-left: auto; display: flex; gap: var(--sp-md); }
</style>
