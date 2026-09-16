<script setup lang="ts">
defineProps<{ boardId: string; colId: string; cardId: string }>();
const emit = defineEmits<{ close: [] }>();
</script>

<template>
  <div class="modal-backdrop" @click.self="emit('close')">
    <div class="modal-card">
      <header class="ribbon-card-title">EDIT CARD (Task 12)</header>
      <div class="modal-stub-body">
        <button class="button-primary" @click="emit('close')">CLOSE</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.modal-stub-body { padding: 16px; }
</style>
