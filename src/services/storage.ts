import type { KanbanState, Board, Column, Card, Label, TintKey } from '../types';
import { TINTS } from '../types';
import { uid, nowISO } from '../utils';

const KEY = 'kanbango:v1';
const APP = 'kanbango';
const VERSION = 1;

/** `typeof`-guarded view of untrusted data; the cast is checked at runtime. */
const asRecord = (v: unknown): Record<string, unknown> =>
  v !== null && typeof v === 'object' ? (v as Record<string, unknown>) : {};
const asArray = (v: unknown): unknown[] => (Array.isArray(v) ? (v as unknown[]) : []);

function isState(v: unknown): v is KanbanState {
  const r = asRecord(v);
  return r.version === VERSION && Array.isArray(r.boards);
}

export function load(): KanbanState | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const p: unknown = JSON.parse(raw);
    if (!isState(p)) return null;
    const boards = p.boards.map(normalizeBoard);
    const activeBoardId =
      typeof p.activeBoardId === 'string' && boards.some((b) => b.id === p.activeBoardId)
        ? p.activeBoardId
        : boards[0]?.id ?? null;
    return { version: VERSION, boards, activeBoardId };
  } catch {
    return null;
  }
}

export function save(state: KanbanState): boolean {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
    return true;
  } catch (e) {
    console.warn('kanbango: save failed (quota/unavailable?)', e);
    return false;
  }
}

export function exportJSON(board: Board): string {
  return JSON.stringify({ app: APP, version: VERSION, exportedAt: nowISO(), board }, null, 2);
}

export function importJSON(text: string): Board[] {
  let parsed: unknown;
  try { parsed = JSON.parse(text); } catch { throw new Error('Not valid JSON'); }
  const p = asRecord(parsed);
  let list: unknown[];
  if (Array.isArray(parsed)) list = asArray(parsed);
  else if (p.board) list = [p.board];
  else if (Array.isArray(p.boards)) list = asArray(p.boards);
  else if (Array.isArray(p.columns)) list = [parsed]; // bare board object
  else throw new Error('Unrecognized export shape');
  return list.map(normalizeBoard);
}

const isTint = (v: unknown): v is TintKey =>
  typeof v === 'string' && (TINTS as string[]).includes(v);
const str = (v: unknown, d: string) => (typeof v === 'string' ? v : d);

function normalizeCard(c: unknown): Card {
  const o = asRecord(c);
  return {
    id: str(o.id, uid()),
    title: str(o.title, 'Card'),
    description: str(o.description, ''),
    labelIds: asArray(o.labelIds).filter((x): x is string => typeof x === 'string'),
    dueDate: typeof o.dueDate === 'string' ? o.dueDate : null,
    subtasks: asArray(o.subtasks).map((s) => {
      const q = asRecord(s);
      return { id: str(q.id, uid()), title: str(q.title, ''), done: !!q.done };
    }),
    createdAt: str(o.createdAt, nowISO()),
    updatedAt: str(o.updatedAt, nowISO()),
  };
}

function normalizeLabel(l: unknown): Label {
  const o = asRecord(l);
  return { id: str(o.id, uid()), name: str(o.name, 'Label'), tint: isTint(o.tint) ? o.tint : 'sky' };
}

function normalizeColumn(c: unknown): Column {
  const o = asRecord(c);
  return {
    id: str(o.id, uid()),
    title: str(o.title, 'Column'),
    tint: isTint(o.tint) ? o.tint : 'sky',
    wipLimit: typeof o.wipLimit === 'number' && o.wipLimit > 0 ? o.wipLimit : null,
    cards: asArray(o.cards).map(normalizeCard),
  };
}

function normalizeBoard(b: unknown): Board {
  const o = asRecord(b);
  if (!Array.isArray(o.columns)) throw new Error('Invalid board: missing columns[]');
  return {
    id: str(o.id, uid()),
    name: str(o.name, 'Imported'),
    columns: asArray(o.columns).map(normalizeColumn),
    labels: asArray(o.labels).map(normalizeLabel),
    createdAt: str(o.createdAt, nowISO()),
    updatedAt: str(o.updatedAt, nowISO()),
  };
}
