<script setup lang="ts">
import { ref, watch, nextTick } from 'vue';
import { useRouter } from 'vue-router';
import { useKanban } from '../stores/kanban';
import type { TintKey } from '../types';
import { TINTS } from '../types';

const store = useKanban();
const router = useRouter();

// ---- board switcher ----
function switchBoard(id: string) {
  if (id && id !== store.activeBoardId) router.push(`/board/${id}`);
}

// ---- copy board link ----
const copied = ref(false);
function copyLink() {
  navigator.clipboard
    ?.writeText(window.location.href)
    .then(() => {
      copied.value = true;
      window.setTimeout(() => {
        copied.value = false;
      }, 2000);
    });
}

// ---- add column (P1 fix: primary action, kept first in the toolbar) ----
const open = ref(false);
const title = ref('');
const tint = ref<TintKey>('steel');
const titleInput = ref<HTMLInputElement>();
// HTML autofocus is ignored on elements rendered after initial mount — focus explicitly.
watch(open, async (v) => {
  if (v) {
    await nextTick();
    titleInput.value?.focus();
  }
});

function add() {
  const boardId = store.activeBoardId;
  const t = title.value.trim();
  if (boardId && t) {
    store.addColumn(boardId, t, tint.value);
    title.value = '';
    open.value = false;
  }
}
</script>

<template>
  <div class="banner-actions">
    <button v-if="!open" type="button" class="sticker-yellow" @click="open = true">
      + ADD COLUMN
    </button>
    <form v-else class="add-form" @submit.prevent="add">
      <input ref="titleInput" class="text-input" v-model="title" placeholder="column title" aria-label="column title" />
      <select class="text-input" v-model="tint">
        <option v-for="t in TINTS" :key="t" :value="t">{{ t }}</option>
      </select>
      <span class="tint-swatch" :class="`tint-swatch-${tint}`" :title="`tint: ${tint}`"></span>
      <button type="submit" class="sticker-yellow">ADD</button>
      <button type="button" class="button-text-link banner-link" @click="open = false">CANCEL</button>
    </form>
    <select
      class="text-input board-switcher"
      :value="store.activeBoardId ?? ''"
      aria-label="switch board"
      @change="switchBoard(($event.target as HTMLSelectElement).value)"
    >
      <option v-for="b in store.boards" :key="b.id" :value="b.id">{{ b.name }}</option>
    </select>
    <button type="button" class="button-text-link banner-link" @click="copyLink">
      {{ copied ? 'COPIED.' : 'COPY LINK' }}
    </button>
  </div>
</template>

<style scoped>
.banner-actions { display: flex; gap: var(--sp-sm); align-items: center; flex-wrap: wrap; }
.add-form { display: flex; gap: var(--sp-sm); }
.board-switcher { max-width: 200px; }
/* white link variant — blue on the black banner reads poorly */
.banner-link { color: var(--c-canvas); }
</style>
