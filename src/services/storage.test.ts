import { describe, it, expect, beforeEach } from 'vitest';
import { load, save, exportJSON, importJSON } from './storage';
import { createStarterBoard } from '../utils';

beforeEach(() => localStorage.clear());

describe('save/load', () => {
  it('round-trips state', () => {
    const b = createStarterBoard('B');
    save({ version: 1, boards: [b], activeBoardId: b.id });
    const s = load();
    expect(s?.boards[0].name).toBe('B');
    expect(s?.activeBoardId).toBe(b.id);
  });
  it('load returns null when empty', () => expect(load()).toBeNull());
  it('load returns null on corrupt JSON', () => {
    localStorage.setItem('kanbango:v1', '{nope');
    expect(load()).toBeNull();
  });
});

describe('export/import', () => {
  it('round-trips a board', () => {
    const b = createStarterBoard('Exp');
    b.columns[0].cards = [{ id: 'c1', title: 't', description: '', labelIds: [], dueDate: null, subtasks: [], createdAt: '', updatedAt: '' }];
    const boards = importJSON(exportJSON(b));
    expect(boards).toHaveLength(1);
    expect(boards[0].name).toBe('Exp');
    expect(boards[0].columns[0].cards[0].title).toBe('t');
  });
  it('rejects malformed JSON', () => expect(() => importJSON('{bad')).toThrow());
  it('rejects unknown shape', () => expect(() => importJSON('{"foo":1}')).toThrow());
  it('accepts a bare board object', () => {
    const b = createStarterBoard('Bare');
    expect(importJSON(JSON.stringify(b))).toHaveLength(1);
  });
});
