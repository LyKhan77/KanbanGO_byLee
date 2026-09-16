<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useKanban } from '../stores/kanban';

const store = useKanban();
const router = useRouter();
const name = ref('');

function create() {
  const n = name.value.trim() || 'My Board';
  const id = store.createBoard(n);
  name.value = '';
  store.setActiveBoard(id);
  router.push(`/board/${id}`);
}
</script>

<template>
  <div class="banner-new-board">
    <input class="text-input" v-model="name" placeholder="board name" />
    <button class="sticker-yellow" @click="create">NEW BOARD</button>
  </div>
</template>

<style scoped>
.banner-new-board { display: flex; gap: var(--sp-sm); }
</style>
