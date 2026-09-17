<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useKanban } from '../stores/kanban';
import type { TintKey } from '../types';
import { TINTS } from '../types';

const store = useKanban();
const router = useRouter();

// ---- add column ----
const open = ref(false);
const title = ref('');
const tint = ref<TintKey>('steel');

function add() {
  const boardId = store.activeBoardId;
  const t = title.value.trim();
  if (boardId && t) {
    store.addColumn(boardId, t, tint.value);
    title.value = '';
    open.value = false;
  }
}

// ---- export / import ----
const fileInput = ref<HTMLInputElement | null>(null);
const importError = ref('');
const importCount = ref(0);

function slug(name: string): string {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'board'
  );
}

function doExport() {
  const boardId = store.activeBoardId;
  if (!boardId) return;
  const board = store.findBoard(boardId);
  const json = store.exportBoard(boardId);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${slug(board.name)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function onFilePicked(e: Event) {
  const input = e.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    const res = store.importBoard(String(reader.result ?? ''));
    if (res.ok) {
      importCount.value = res.count;
      importError.value = '';
      // importBoard re-pointed activeBoardId to the first imported board
      if (store.activeBoardId) router.replace(`/board/${store.activeBoardId}`);
    } else {
      importError.value = res.error;
      importCount.value = 0;
    }
  };
  reader.onerror = () => {
    importError.value = 'Could not read the file.';
    importCount.value = 0;
  };
  reader.readAsText(file);
  input.value = '';
}
</script>

<template>
  <div class="banner-actions">
    <button type="button" class="sticker-yellow" :disabled="!store.activeBoardId" @click="doExport">
      EXPORT
    </button>
    <button type="button" class="sticker-yellow" @click="fileInput?.click()">IMPORT</button>
    <input
      ref="fileInput"
      type="file"
      accept="application/json,.json"
      class="file-input"
      @change="onFilePicked"
    />
    <button v-if="!open" type="button" class="sticker-yellow" @click="open = true">
      + ADD COLUMN
    </button>
    <form v-else class="add-form" @submit.prevent="add">
      <input class="text-input" v-model="title" placeholder="column title" autofocus />
      <select class="text-input" v-model="tint">
        <option v-for="t in TINTS" :key="t" :value="t">{{ t }}</option>
      </select>
      <button type="submit" class="sticker-yellow">ADD</button>
      <button type="button" class="button-text-link banner-link" @click="open = false">CANCEL</button>
    </form>
  </div>
  <p v-if="importError" class="error-line banner-error">IMPORT FAILED: {{ importError }}</p>
  <p v-if="importCount" class="import-ok">{{ importCount }} BOARD(S) IMPORTED.</p>
</template>

<style scoped>
.banner-actions { display: flex; gap: var(--sp-sm); align-items: center; flex-wrap: wrap; }
.add-form { display: flex; gap: var(--sp-sm); }
.file-input { display: none; }
/* white link variant — blue on the black banner reads poorly */
.banner-link { color: var(--c-canvas); }
/* spec §9 error line, readable on the black banner: white chip, blue underline text */
.banner-error {
  background: var(--c-canvas);
  color: var(--c-link);
  font-family: var(--font-body); font-size: 12px;
  padding: 2px 8px; margin-top: var(--sp-xs);
}
.import-ok {
  color: var(--c-canvas); font-family: var(--font-ui);
  font-weight: 700; font-size: 11px; margin-top: var(--sp-xs);
}
</style>
