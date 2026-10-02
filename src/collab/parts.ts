/**
 * The notebook as "parts" for real-time collaboration (COLLAB-002), as in
 * Progressive Web Office: one part per cell (`c:<uid>`, a JSON string of its
 * content and settings) and the ordered list of cell identifiers. Two people
 * editing different cells never overwrite each other; outputs are not shared
 * (COLLAB-003): each participant evaluates the cells locally.
 */

export interface CollabParts {
  /** Independent parts addressed by a stable key. */
  keys: Record<string, string>;
  /** Ordered parts: the cell identifiers. */
  list: string[];
}

/** What is shared of a cell: its content and settings, not its outputs. */
export interface CellSnapshot {
  type: string;
  /** Math cells: 'math' (visual) or 'raw'. */
  mode?: string;
  /** Math cells in visual mode: the LaTeX as typed. */
  latex?: string;
  /** Raw and text cells, math cells in raw mode. */
  content?: string;
  hidden?: boolean;
  disabled?: boolean;
  locked?: boolean;
  /** Slider cells. */
  params?: unknown[];
  expression?: string;
  plotType?: string;
}

export interface NotebookCell {
  uid: string;
  cell: CellSnapshot;
}

/** JSON with sorted object keys, so that equal cells give equal strings. */
export function stableStringify(value: unknown): string {
  const sort = (v: unknown): unknown => {
    if (Array.isArray(v)) return v.map(sort);
    if (v && typeof v === 'object') {
      const out: Record<string, unknown> = {};
      for (const key of Object.keys(v).sort()) {
        const x = (v as Record<string, unknown>)[key];
        if (x !== undefined) out[key] = sort(x);
      }
      return out;
    }
    return v;
  };
  return JSON.stringify(sort(value));
}

const KEY = (uid: string): string => `c:${uid}`;

export function notebookParts(cells: NotebookCell[]): CollabParts {
  const keys: Record<string, string> = {};
  for (const { uid, cell } of cells) keys[KEY(uid)] = stableStringify(cell);
  return { keys, list: cells.map((c) => c.uid) };
}

/** The cells described by `parts`, in order; list entries without a part (or duplicated) are skipped. */
export function partsNotebook(parts: CollabParts): NotebookCell[] {
  const seen = new Set<string>();
  const cells: NotebookCell[] = [];
  for (const uid of parts.list) {
    const text = parts.keys[KEY(uid)];
    if (text === undefined || seen.has(uid)) continue;
    seen.add(uid);
    try {
      cells.push({ uid, cell: JSON.parse(text) as CellSnapshot });
    } catch {
      /* a damaged part is skipped */
    }
  }
  return cells;
}
