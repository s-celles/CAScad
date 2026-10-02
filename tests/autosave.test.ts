import { describe, expect, it } from 'bun:test';
import { readSavedNotebook, STORAGE_KEY } from '../src/autosave';

const storage = (value: string | null) => ({ getItem: (key: string) => (key === STORAGE_KEY ? value : null) });

describe('FILE-005 saved notebook', () => {
  it('reads a saved notebook', () => {
    const data = { type: 'cascad-notebook', cells: [{ type: 'raw', content: '1+1' }] };
    expect(readSavedNotebook(storage(JSON.stringify({ savedAt: '2026-10-02T00:00:00Z', data })))).toEqual(data);
  });

  it('ignores a missing, empty or damaged copy', () => {
    expect(readSavedNotebook(storage(null))).toBeNull();
    expect(readSavedNotebook(storage('{not json'))).toBeNull();
    expect(readSavedNotebook(storage(JSON.stringify({ data: { cells: [] } })))).toBeNull();
    expect(readSavedNotebook(storage(JSON.stringify({ data: { cells: 'x' } })))).toBeNull();
  });
});
