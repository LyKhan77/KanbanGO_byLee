# Changelog

## 2026-09-18 — MOVE TO column in card modal + 44px touch targets

### Context
- Cluster C: drag-and-drop stays the primary move mechanism, but cards had no keyboard or mouse alternative for moving a card between columns. Interactive controls also measured ~32-36px tall, below the 44px comfortable touch target.

### Changed
- `src/components/CardModal.vue`: new `MOVE TO` select (lists all board columns, current column preselected, changing it appends the card to the end of the target column). Tracks the card's live column in `currentColId` so DELETE still targets the right column after a move (previously `props.colId` went stale — a silent no-op delete after moving). `card` computed made null-tolerant (searches boards directly instead of `store.findCard()`), fixing a re-render throw after the card is deleted.
- `src/components/CardModal.test.ts` (new): 3 component tests — move via select appends at end, selecting the current column is a no-op, delete works after a move (regression for the stale-column no-op).
- `src/styles/global.css`: `min-height: 44px` on primary/secondary buttons, text-link buttons, menu toggles, text inputs, chip toggles, and footer nav links (padding already centered content vertically).

### Evidence
- `npm test` → 39/39 pass; `npm run build` exit 0.
- Live browser (throwaway test board, deleted afterwards): select lists both columns; changing it moved the card (source 0 / target 1, end position); measured heights all exactly 44px (modal SAVE, column menu toggle, footer nav link, modal input). User's live board untouched.

### Impact
- UI + one store call path; no schema change. Delete in the modal now works after a move (was a silent no-op).

### Rollback
- `git revert` the commit carrying this section.

## 2026-09-17 — Card modal keyboard & a11y

### Context
- Cluster B: the card edit modal was pointer-only (close via backdrop or SAVE). Brought in line with the ConfirmDialog pattern shipped the same day.

### Changed
- `src/components/CardModal.vue`: `role="dialog"` + `aria-modal` + `aria-label="Edit card"`; CANCEL button in footer; Escape closes; focus moves to the title input on open (programmatic — HTML `autofocus` is ignored on dynamically rendered elements); focus returns to the previously focused element (the card button) on close.
- `src/components/ConfirmDialog.vue`: `@keydown.esc.stop` so Escape in a nested confirm closes only the confirm, not the card modal below.

### Evidence
- `npm test` → 36/36 pass; `npm run build` exit 0.
- Live browser: a11y tree shows `dialog "Edit card"`; focus lands on the title input when opened; Escape closes the modal; CANCEL closes the modal; Escape while the confirm is open closes only the confirm; focus returns to the card button after closing.

### Impact
- UI only; store logic unchanged.

### Rollback
- `git revert` the commit carrying this section.

## 2026-09-17 — Modal confirmation dialog

### Context
- User request: every destructive confirmation must use a modal (retro design system), replacing native `confirm()`.

### Changed
- New `src/components/ConfirmDialog.vue`: retro modal — `role="alertdialog"`, "ARE YOU SURE?" ribbon, CANCEL autofocused, Escape closes, backdrop click cancels.
- Replaced native `confirm()` at all three destructive call sites: board delete (`src/components/BoardRow.vue`), column delete (`src/components/Column.vue`), card delete (`src/components/CardModal.vue` — nested above the card modal).
- Card delete message aligned with board wording: `Delete this card? This cannot be undone.`

### Evidence
- `npm test` → 36/36 pass; `npm run build` (vue-tsc -b + vite) exit 0.
- Live browser: all three dialogs render as `alertdialog`; Escape and CANCEL cancel without deleting; confirm deletes board/column/card; card dialog renders above the open card modal.

### Impact
- UI only; store logic unchanged. Card confirm message text gained "This cannot be undone."

### Rollback
- `git revert` the commit carrying this section.

## 2026-09-17 — UI/UX quick wins

### Context
- Post-launch UI/UX review (live browser testing + code audit). The Dell 1996 design system (DESIGN.md) stays untouched; four targeted UX fixes.

### Changed
- Empty state for boards with no columns: `NO COLUMNS YET — USE "+ ADD COLUMN" IN THE BANNER ABOVE.` (`src/views/BoardView.vue`).
- Import now merges by board id: re-importing an existing board replaces it instead of creating a silent duplicate row (`src/stores/kanban.ts`, `importBoard`).
- Card title hover changed from sticker yellow to a neutral 2px ink outline — yellow stays reserved for sticker chrome (OVERDUE / OVER! / NEW) (`src/components/KanbanCard.vue`).
- `aria-label` added to placeholder-only inputs so screen readers keep a stable accessible name while typing (board name, search cards, add a card, column title ×2, WIP limit, new label) (`src/components/BoardListBanner.vue`, `src/views/BoardView.vue`, `src/components/Column.vue`, `src/components/BoardBanner.vue`, `src/components/LabelPicker.vue`).

### Evidence
- `npm test` → 36/36 pass (new test: importing the same file twice replaces instead of duplicating).
- `npm run build` → exit 0; built CSS contains `.card-title:hover { outline: 2px solid var(--c-ink); outline-offset: -2px }`.
- Live browser: new board renders the empty state; importing one file twice leaves a single board row; search input exposed as `textbox "search cards"` in the accessibility tree.

### Impact
- UX/a11y only. Export JSON format unchanged (imports stay compatible with old exports).

### Rollback
- `git revert` the commit carrying this section.

## 2026-09-17 — Dev server port

### Changed
- Vite dev server now runs on port 5454 (`vite.config.ts`).

### Evidence
- `curl http://localhost:5454/` → HTTP 200.

### Impact
- Dev-only. `npm run build` / preview unchanged.

### Rollback
- Remove `server: { port: 5454 }` from `vite.config.ts`.

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
