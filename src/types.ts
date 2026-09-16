export type TintKey =
  | 'olive' | 'sage' | 'salmon' | 'peach'
  | 'lime' | 'sky' | 'steel' | 'periwinkle';

export const TINTS: TintKey[] = [
  'olive', 'sage', 'salmon', 'peach', 'lime', 'sky', 'steel', 'periwinkle',
];

export interface Subtask { id: string; title: string; done: boolean }
export interface Label { id: string; name: string; tint: TintKey }

export interface Card {
  id: string;
  title: string;
  description: string;
  labelIds: string[];
  dueDate: string | null;
  subtasks: Subtask[];
  createdAt: string;
  updatedAt: string;
}

export interface Column {
  id: string;
  title: string;
  tint: TintKey;
  wipLimit: number | null;
  cards: Card[];
}

export interface Board {
  id: string;
  name: string;
  columns: Column[];
  labels: Label[];
  createdAt: string;
  updatedAt: string;
}

export interface KanbanState {
  version: 1;
  boards: Board[];
  activeBoardId: string | null;
}
