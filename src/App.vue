<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import AppShell from './components/AppShell.vue';
import { useKanban } from './stores/kanban';

const route = useRoute();
const store = useKanban();
const title = computed(() =>
  route.name === 'board'
    ? store.activeBoard?.name ?? 'BOARD'
    : 'KANBANGO — BUILD YOUR BOARD. ONLINE.',
);
</script>

<template>
  <AppShell :title="title">
    <RouterView />
    <template #banner-action>
      <RouterView name="banner" />
    </template>
  </AppShell>
</template>
