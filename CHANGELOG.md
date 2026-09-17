# Changelog

## 2026-09-16 — KanbanGo v1.0

### Added
- Local-first kanban app: Vue 3 + Pinia + vue-router + vue-draggable-next, TypeScript, Vite, Vitest. No backend, no UI library, no webfonts.
- Multi-board: create / rename / delete with counts + updated date (`src/stores/kanban.ts`, `src/views/BoardListView.vue`, `src/components/BoardRow.vue`).
- Columns: 8 tints, quick-add card, soft WIP limit with "OVER!" sticker, rename / tint / WIP / delete via column menu (`src/components/Column.vue`).
- Cards: title, description, due date (overdue = bold + yellow, never red), labels with 8 tints, subtasks with progress (`src/components/KanbanCard.vue`, `src/components/CardModal.vue`, `src/components/LabelPicker.vue`, `src/components/SubtaskList.vue`).
- Drag & drop across and within columns (`vue-draggable-next`); disabled while filters are active (`src/components/Column.vue`).
- Search (substring) + label filters (OR) with clear (`src/views/BoardView.vue`, `filteredCards` in the store).
- Export / import board JSON with original id preservation and error line on failure (`src/services/storage.ts`, `src/components/BoardBanner.vue`).
- Persistence: deep-watched `localStorage` (`kanbango:v1`); save failure surfaced as a footer error line (`src/stores/kanban.ts`, `src/components/AppShell.vue`).
- Dell 1996 design system: tokens + global CSS primitives (`src/styles/tokens.css`, `src/styles/global.css`).

### Evidence
- `npm test` → all suites pass (utils, storage, kanban store).
- `npm run build` → exit code 0.
- Manual smoke: all 16 walkthrough lines of the plan (Task 15, Step 3) + the save-failure check (Step 4) pass.

### Impact
- Personal, local-first use only; data lives in `localStorage` under key `kanbango:v1`.

### Rollback
- No migrations. Remove the `kanbango:v1` localStorage key and `git revert` the feature commits; the repo root is this project.
