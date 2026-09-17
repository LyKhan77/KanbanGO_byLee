<script setup lang="ts">
import { ref, computed } from 'vue';
import { useKanban } from '../stores/kanban';
import type { TintKey } from '../types';
import { TINTS } from '../types';

const props = defineProps<{ boardId: string; selected: string[] }>();
const emit = defineEmits<{ toggle: [labelId: string] }>();
const store = useKanban();

const labels = computed(() => store.findBoard(props.boardId).labels);
const newLabel = ref('');
const newTint = ref<TintKey>('sky');

function createLabel() {
  const name = newLabel.value.trim();
  if (!name) return;
  store.addLabel(props.boardId, name, newTint.value);
  const list = store.findBoard(props.boardId).labels;
  const created = list[list.length - 1];
  if (created) emit('toggle', created.id);
  newLabel.value = '';
}
</script>

<template>
  <div class="label-picker">
    <div class="chip-row">
      <button
        v-for="l in labels"
        :key="l.id"
        type="button"
        class="label-chip chip-toggle"
        :class="[`label-chip-${l.tint}`, { 'chip-active': props.selected.includes(l.id) }]"
        @click="emit('toggle', l.id)"
      >{{ l.name }}</button>
      <span v-if="labels.length === 0" class="muted-note">no labels yet</span>
    </div>
    <div class="chip-create">
      <input class="text-input" v-model="newLabel" placeholder="new label" />
      <select class="text-input" v-model="newTint">
        <option v-for="t in TINTS" :key="t" :value="t">{{ t }}</option>
      </select>
      <button type="button" class="button-secondary" @click="createLabel">ADD</button>
    </div>
  </div>
</template>

<style scoped>
.chip-row { display: flex; flex-wrap: wrap; gap: var(--sp-xs); }
.chip-toggle { cursor: pointer; }
.chip-active { outline: 2px solid var(--c-ink); outline-offset: 1px; }
.muted-note { font-style: italic; font-size: 12px; }
.chip-create { display: flex; gap: var(--sp-xs); margin-top: var(--sp-xs); }
</style>
