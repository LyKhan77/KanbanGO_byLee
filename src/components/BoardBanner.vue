<script setup lang="ts">
import { ref } from 'vue';
import { useKanban } from '../stores/kanban';
import type { TintKey } from '../types';
import { TINTS } from '../types';

const store = useKanban();
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
</script>

<template>
  <div class="banner-actions">
    <button v-if="!open" class="sticker-yellow" @click="open = true">+ ADD COLUMN</button>
    <form v-else class="add-form" @submit.prevent="add">
      <input class="text-input" v-model="title" placeholder="column title" autofocus />
      <select class="text-input" v-model="tint">
        <option v-for="t in TINTS" :key="t" :value="t">{{ t }}</option>
      </select>
      <button type="submit" class="sticker-yellow">ADD</button>
      <button type="button" class="button-text-link banner-link" @click="open = false">CANCEL</button>
    </form>
  </div>
</template>

<style scoped>
.banner-actions { display: flex; gap: var(--sp-sm); align-items: center; }
.add-form { display: flex; gap: var(--sp-sm); }
/* white link variant — blue on the black banner reads poorly */
.banner-link { color: var(--c-canvas); }
</style>
