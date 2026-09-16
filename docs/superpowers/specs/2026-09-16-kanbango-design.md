# KanbanGo — Design Specification

**Date:** 2026-09-16
**Status:** Approved (brainstorm) — ready for implementation plan
**Stack:** Vue 3 (Composition API) + Vite + Pinia + Vue Router + vue-draggable-next
**Design system:** `DESIGN.md` (Dell 1996)
**Repo note:** directory is not yet a git repository; no commit made.

---

## 1. Overview & Goals

KanbanGo is a kanban board web app. v1 is **personal-first**: one user manages their own boards in the browser, data lives in `localStorage`, and boards can be **exported/imported as JSON files** on the local computer. The architecture is **team-ready**: all persistence is isolated behind a single adapter, so a later upgrade to a multi-user backend (e.g. Supabase) touches only that adapter — components and the store stay unchanged.

### Goals
- Complete kanban UX: multiple boards, columns, cards, drag & drop.
- All eight v1 features (Section 4) plus JSON export/import.
- A distinctive retro look that strictly follows `DESIGN.md` (Dell 1996).
- Zero backend in v1. Data persists in the browser and is portable via JSON.

### Non-goals (v1)
- No authentication, accounts, multi-user, or real-time sync.
- No cloud storage; no server of any kind.
- No PWA / native. Responsive web only.
- No component-test suite (logic-only tests — Section 10).

---

## 2. Locked Decisions

| Decision | Choice |
|---|---|
| Use case | Personal-first, team-ready seam |
| Persistence | `localStorage` + JSON file export/import |
| Features | All eight in Section 4 |
| Framework | Vue 3 (Composition API) + Vite |
| State | Pinia |
| Routing | Vue Router |
| Drag & drop | vue-draggable-next (SortableJS) |
| Styling | CSS custom properties (tokens from `DESIGN.md`) + scoped CSS. **No** Tailwind, **no** component library |
| Design system | `DESIGN.md` (Dell 1996) |
| WIP limit behavior | Soft — warn, do not block the drop |

---

## 3. Architecture

### 3.1 Layers

```
┌────────────────────────────────────────────────┐
│ VUE COMPONENTS (views + components)            │
│  AppShell / BoardListView / BoardView /        │
│  Column / KanbanCard / CardModal /             │
│  LabelPicker / SubtaskList / BoardRow          │
├────────────────────────────────────────────────┤
│ PINIA STORE  (useKanban)                       │
│  state: boards, activeBoardId, filters         │
│  actions: board/column/card CRUD, moveCard,    │
│           label CRUD, export, import           │
│  getters: activeBoard, filteredCards, overWip  │
├────────────────────────────────────────────────┤
│ PERSISTENCE ADAPTER  (services/storage.ts) ◄SEAM│
│  load() · save(state) · exportJSON() ·         │
│  importJSON()   [impl: localStorage]           │
├────────────────────────────────────────────────┤
│ localStorage  (key: kanbango:v1)               │
└────────────────────────────────────────────────┘
```

### 3.2 Team-ready seam
`services/storage.ts` is the **only** module that touches storage. It exposes:

```ts
load(): KanbanState | null
save(state: KanbanState): void
exportJSON(board: Board): string
importJSON(text: string): Board | Board[]   // throws on invalid
```

The v1 implementation uses `localStorage`. A team upgrade replaces this single file with an API client implementing the same signatures; nothing else changes.

### 3.3 Routes

| Path | View | Purpose |
|---|---|---|
| `/` | `BoardListView` | List boards, create board |
| `/board/:boardId` | `BoardView` | Board: columns, drag & drop, card modal, export |
| invalid `:boardId` | — | Redirect to `/` |

### 3.4 File structure

```
src/
  main.ts · App.vue
  router/index.ts
  types.ts                 # TintKey/Label/Subtask/Card/Column/Board/KanbanState
  stores/kanban.ts         # Pinia store
  services/storage.ts      # ◄ SEAM (persistence adapter)
  views/BoardListView.vue
  views/BoardView.vue
  components/
    AppShell.vue           # page-frame + top-banner + footer-band
    BoardRow.vue           # one board row in the list
    Column.vue             # eyebrow + card list + add + WIP badge
    KanbanCard.vue         # ribbon card
    CardModal.vue          # create/edit card detail
    LabelPicker.vue
    SubtaskList.vue
  styles/tokens.css        # design tokens from DESIGN.md
  styles/global.css
```

---

## 4. Requirements — v1 Features

Each feature has an acceptance criterion.

1. **Multiple boards** — Create, rename, delete boards. Boards are listed at `/`; clicking one navigates to it. Each board is independent (own columns, cards, labels).
2. **Column & card CRUD** — Create/rename/delete columns in a board. Create cards (quick title add at column bottom) and edit (title, description, labels, due date, subtasks) and delete cards.
3. **Drag & drop** — A card can be reordered within a column and moved to any other column. Resulting order persists across reload.
4. **Labels + colors** — A board has a set of labels (name + one of the eight tints). A card can carry multiple labels. Labels render as colored chips on the card.
5. **Due date** — A card has an optional due date (`YYYY-MM-DD`), shown on the card. Overdue cards are highlighted (see Section 8 rules).
6. **Subtasks** — A card has an ordered list of subtasks (title + done). Toggling a subtask updates the card's progress indicator (`x/y`).
7. **Search & filter** — A text search matches card title/description (case-insensitive substring). A label filter shows cards carrying **at least one** of the selected labels (OR). When both are active, the query ANDs with the label match. Both apply within the current board only.
8. **WIP limit** — A column can have an optional numeric WIP limit. When the column's card count exceeds the limit, a warning badge is shown; the drop is still allowed (soft).

**Persistence extras:**
9. **Export** — Export the current board to a `<board-name>.json` file.
10. **Import** — Import a board JSON file (single board or multi-board shape) into the app; malformed files are rejected with a message and leave state unchanged.

---

## 5. Data Model

```ts
type TintKey =
  | 'olive' | 'sage' | 'salmon' | 'peach'
  | 'lime' | 'sky' | 'steel' | 'periwinkle';   // the 8 DESIGN.md tints

type Subtask = { id: string; title: string; done: boolean };

type Label = { id: string; name: string; tint: TintKey };

type Card = {
  id: string;
  title: string;
  description: string;      // body copy (Times Roman)
  labelIds: string[];       // references Board.labels
  dueDate: string | null;   // "YYYY-MM-DD"
  subtasks: Subtask[];
  createdAt: string;        // ISO
  updatedAt: string;        // ISO
};

type Column = {
  id: string;
  title: string;
  tint: TintKey;            // eyebrow block color
  wipLimit: number | null;
  cards: Card[];            // ORDERED & EMBEDDED → DnD binds :list directly
};

type Board = {
  id: string;
  name: string;
  columns: Column[];        // ordered
  labels: Label[];
  createdAt: string;
  updatedAt: string;
};

type KanbanState = {
  version: 1;
  boards: Board[];
  activeBoardId: string | null;
};
```

Notes:
- All ids use `crypto.randomUUID()`.
- Cards are **embedded in columns** (ordered `Card[]`). This lets `vue-draggable-next` bind `:list="column.cards"` and handle cross-column moves natively — minimal glue code. Appropriate for a personal board with modest card counts.
- `version` is a forward-compatibility field for the export format and storage key.

---

## 6. State Management (Pinia)

`stores/kanban.ts` → `useKanban()`.

**State**
- `boards: Board[]`
- `activeBoardId: string | null`
- `filters: { query: string; labelIds: string[] }`

**Getters**
- `activeBoard: Board | null`
- `filteredCards(boardId, columnId): Card[]` — a column's cards matching `filters.query` (case-insensitive substring of title/description) AND, when `filters.labelIds` is non-empty, carrying at least one of those labels (OR within the set).
- `isOverWip(column: Column): boolean` — `column.wipLimit != null && column.cards.length > column.wipLimit`.

**Actions** (all touch `updatedAt` and, via `$subscribe`, trigger `storage.save`)
- Board: `createBoard(name)`, `renameBoard(id, name)`, `deleteBoard(id)`, `setActiveBoard(id)`.
- Column: `addColumn(boardId, title)`, `renameColumn`, `setWipLimit(boardId, columnId, limit|null)`, `deleteColumn`.
- Card: `addCard(boardId, columnId, title)`, `updateCard(boardId, cardId, patch)`, `deleteCard`, `moveCard(boardId, fromColumnId, toColumnId, toIndex)` (programmatic reorder), `touchBoard(boardId)` (stamps `updatedAt` after a DnD mutation).
- Label: `addLabel(boardId, {name, tint})`, `deleteLabel`.
- Subtask: `addSubtask`, `toggleSubtask`, `deleteSubtask` (operate on a card).
- Data: `exportBoard(boardId)`, `importBoard(text)` (calls `storage.importJSON`, validates, appends/merges, returns a success/error result for the UI to surface).

**Persistence**
- Boot: `store.$patch(storage.load() ?? defaultState())`.
- `store.$subscribe` → `storage.save(state)` (debounced ~150 ms).
- `defaultState()`: `version:1`, one starter board with three columns (TO DO / DOING / DONE) and no cards, so the app is usable on first run.

---

## 7. Drag & Drop

- `vue-draggable-next` on each `Column`'s card list.
- `group="kanban"` shared across all columns → cross-column moves allowed; `pull: true`, `put: true`.
- `:list="column.cards"` — live reactive binding (the embedded ordered array).
- SortableJS mutates `column.cards` in place during the drag (reorder within a column, or remove-from-source / insert-into-target for cross-column moves). Vue reactivity tracks this, so Pinia's `$subscribe` persists it automatically. The `@change` handler only calls `store.touchBoard(boardId)` to stamp `updatedAt`.
- Cards render a visible drag handle (and the whole card is draggable) per the ribbon-card chrome.

---

## 8. Design Language (DESIGN.md)

### 8.1 Tokens (CSS custom properties, `styles/tokens.css`)

```css
:root {
  /* colors */
  --c-primary: #e91d2a;      /* Dell red — CTA + callout ONLY */
  --c-yellow:  #fcc20f;      /* sticker yellow */
  --c-purple:  #6a26a4;
  --c-ink:     #000000;
  --c-canvas:  #ffffff;
  --c-link:    #0000ee;      /* classic Mosaic link blue */
  --c-tint-olive: #8e8a25; --c-tint-sage: #b3bd95;
  --c-tint-salmon: #d77a7a; --c-tint-peach: #e6915d;
  --c-tint-lime: #c0d4a7; --c-tint-sky: #9ab6c8;
  --c-tint-steel: #a5b8c0; --c-tint-periwinkle: #8c9ae0;
  /* type */
  --font-display: 'Arial Black', Helvetica, sans-serif;
  --font-ui: Helvetica, Arial, sans-serif;
  --font-body: 'Times New Roman', Times, serif;
  /* spacing (4px base) */
  --sp-xs: 4px; --sp-sm: 8px; --sp-md: 12px;
  --sp-lg: 16px; --sp-xl: 20px; --sp-xxl: 24px;
  /* shape */
  --r-none: 0; --r-full: 9999px;
  /* depth (hard only) */
  --border: 1px solid var(--c-ink);
  --frame: 8px solid var(--c-ink);
}
```

### 8.2 UI element → DESIGN.md primitive

| UI element | DESIGN.md primitive |
|---|---|
| App frame | `page-frame` (black 8px) |
| Top banner (board name, actions) | `top-banner` + `buy-a-dell-sticker` (yellow tab for the primary action) |
| Column header | `section-eyebrow-<tint>` (color block, chunky bold title) |
| Kanban card | `ribbon-card` = `ribbon-card-title` (white bar) + `ribbon-card-body-<tint>` |
| Label chip | label's tint fill |
| Buttons (NEW BOARD, export) | `button-primary` (black) / `button-secondary` (white) |
| WIP-over warning | `new-burst-sticker` (yellow, "OVER!") |
| Overdue indicator | **bold + yellow sticker** (red stays reserved) |
| Inputs | `text-input` (white, 1px black border, Times) |
| Footer | `footer-band` (small print + classic-blue links) |

### 8.3 Global rules
- Border radius **0** everywhere (only decorative seals use `--r-full`).
- **No soft shadows** — hard borders/bevels only.
- Dell red reserved for a single CTA per page.
- Body text in Times Roman; display in Arial Black; **system fonts only** (no webfonts).
- Flat fills; no gradients or opacity.

---

## 9. Error Handling

- **Import failure** (bad version/shape): show a message styled as a classic-blue link/error line; state is unchanged.
- **`localStorage` full/unavailable**: warn, continue in memory, prompt the user to export.
- **Empty states:** no boards → empty-state card + CTA; empty column → "ADD CARD"; no search matches → "no matching cards".
- **Invalid `:boardId`** route → redirect to `/`.

---

## 10. Testing (logic-only, small surface)

- **Vitest** unit tests for pure logic:
  - `storage.ts`: export/import round-trip; rejects wrong version / malformed shape.
  - store: `moveCard` (programmatic reorder: order preserved + WIP flag), `filteredCards` (query + label, OR semantics), `isOverWip`.
- **No component tests** in v1 — drag & drop is verified manually in the browser.
- **Smoke:** `npm run dev` → create board/column/card, drag between columns, export, import, reload → data persists.

---

## 11. Assumptions & Open Points

- Overdue uses **bold + yellow**, not Dell red, to respect the red-reservation rule. (Flag if you'd rather use red for overdue.)
- Export scope is **per-board** by default; the import path also accepts a multi-board shape. (Add an "export all" action only if requested.)
- Starter board on first run (TO DO / DOING / DONE) is assumed helpful; remove if you prefer a blank start.

---

## 12. Future — Team Upgrade (out of scope for v1)

Replace `services/storage.ts` with a backend client (e.g. Supabase: auth + Postgres + realtime). Add auth, per-board permissions, and cross-user sync. No component or store signature changes required beyond that swap.
