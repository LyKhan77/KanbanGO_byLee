<script setup lang="ts">
import { onMounted, ref } from 'vue';

withDefaults(
  defineProps<{ message: string; confirmLabel?: string }>(),
  { confirmLabel: 'DELETE' },
);
const emit = defineEmits<{ confirm: []; cancel: [] }>();

const cancelRef = ref<HTMLButtonElement>();

// focus the safe action so Esc/Enter land inside the dialog
onMounted(() => cancelRef.value?.focus());
</script>

<template>
  <div class="modal-backdrop" @click.self="emit('cancel')" @keydown.esc="emit('cancel')">
    <div class="modal-card confirm-card" role="alertdialog">
      <header class="ribbon-card-title">ARE YOU SURE?</header>
      <p class="confirm-message">{{ message }}</p>
      <footer class="confirm-foot">
        <span class="spacer" />
        <button ref="cancelRef" type="button" class="button-secondary" @click="emit('cancel')">
          CANCEL
        </button>
        <button type="button" class="button-primary" @click="emit('confirm')">
          {{ confirmLabel }}
        </button>
      </footer>
    </div>
  </div>
</template>

<style scoped>
.confirm-card { max-width: 420px; }
.confirm-message { margin: 0; padding: var(--sp-lg); font-family: var(--font-body); font-size: 14px; }
.confirm-foot {
  display: flex; gap: var(--sp-md); align-items: center;
  border-top: var(--border);
  padding: var(--sp-md) var(--sp-lg);
}
.spacer { flex: 1; }
</style>
