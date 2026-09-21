<script setup lang="ts">
import BoardRow from '../components/BoardRow.vue';
import { useKanban } from '../stores/kanban';

const store = useKanban();
</script>

<template>
  <div>
    <h2 class="section-eyebrow section-eyebrow-steel">BOARDS</h2>
    <div class="board-list">
      <p v-if="store.boards.length === 0" class="empty-state">
        NO BOARDS YET — USE THE NEW BOARD BUTTON ABOVE.
      </p>
      <BoardRow v-for="b in store.boards" :key="b.id" :board="b" />
    </div>
  </div>
</template>

<style scoped>
.board-list { margin-top: var(--sp-lg); }
/* P1 fix: the shared 36px .section-eyebrow was consuming a huge slab above a
   near-empty list; de-emphasize it here without touching the shared class
   (still used at full size for genuine product-family section headers). */
.section-eyebrow { font-size: 20px; padding: 12px 16px; }
</style>
