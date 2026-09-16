import type { Board, TintKey } from './types';

export function uid(): string { return crypto.randomUUID(); }
export function nowISO(): string { return new Date().toISOString(); }
export function todayISO(): string { return new Date().toISOString().slice(0, 10); }

export function isOverdue(dueDate: string | null, today: string = todayISO()): boolean {
  return dueDate != null && dueDate < today;
}

export function createStarterBoard(name = 'My Board'): Board {
  const mk = (title: string, tint: TintKey) => ({ id: uid(), title, tint, wipLimit: null, cards: [] });
  const t = nowISO();
  return {
    id: uid(),
    name,
    columns: [mk('TO DO', 'sky'), mk('DOING', 'peach'), mk('DONE', 'lime')],
    labels: [],
    createdAt: t,
    updatedAt: t,
  };
}
