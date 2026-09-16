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
</style>
