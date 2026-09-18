<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useKanban } from '../stores/kanban';

defineProps<{ title: string }>();
const store = useKanban();
const route = useRoute();
const router = useRouter();
// EXPORT only makes sense on the board page (store keeps last activeBoardId)
const onBoard = computed(() => route.name === 'board');

// ---- export / import (lives in the footer nav so those links are real) ----
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
  <div class="page-frame">
    <div class="page-frame-inner">
      <header class="top-banner">
        <h1>{{ title }}</h1>
        <span class="phone-callout">1-800-KANBANGO</span>
        <slot name="banner-action" />
      </header>

      <main class="page-main">
        <slot />
      </main>

      <footer class="footer-band">
        <nav class="icon-label-nav">
          <button type="button" class="sticker-yellow" :disabled="!onBoard || !store.activeBoardId" @click="doExport">
            EXPORT
          </button>
          <button type="button" class="sticker-yellow" @click="fileInput?.click()">
            IMPORT
          </button>
          <input
            ref="fileInput"
            type="file"
            accept="application/json,.json"
            class="file-input"
            @change="onFilePicked"
          />
        </nav>
        <p v-if="store.saveFailed" class="error-line">
          Storage is full or unavailable — export your board to keep a copy. Data stays in memory for this session.
        </p>
        <p v-if="importError" class="error-line">IMPORT FAILED: {{ importError }}</p>
        <p v-if="importCount" class="footer-import-ok">{{ importCount }} BOARD(S) IMPORTED.</p>
        <p class="footer-copy">© 1996 KANBANGO. This site is best viewed in 800×600 with browser versions 3.0 and higher.</p>
        <p class="footer-copy"><a href="#">Copyright</a> · <a href="#">(Terms of Use)</a></p>
      </footer>
    </div>
  </div>
</template>

<style scoped>
.page-main { flex: 1; padding: var(--sp-lg); }
.file-input { display: none; }
.footer-import-ok { color: var(--c-ink); font-weight: 700; margin-top: 4px; }
</style>
