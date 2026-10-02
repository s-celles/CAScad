/**
 * The open notebook as seen by the collaboration binding (COLLAB-002): its
 * cells as parts, and remote changes applied in place by js/io.js.
 */
import type { CollabAdapter } from './binding';
import { notebookParts, partsNotebook, type NotebookCell } from './parts';

export function notebookAdapter(): CollabAdapter {
  return {
    read: () => notebookParts(window.notebookCells()),
    write: (parts) => void window.applyNotebookCells(partsNotebook(parts)),
  };
}

declare global {
  interface Window {
    /** The open notebook's cells: content and settings, no outputs (js/io.js). */
    notebookCells(): NotebookCell[];
    /** Bring the open notebook to these cells, evaluating the changed ones (js/io.js). */
    applyNotebookCells(cells: NotebookCell[]): string[];
  }
}
