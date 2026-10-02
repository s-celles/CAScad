/**
 * Keeps the open notebook in the browser (FILE-005): saved shortly after each
 * change and when the page is closed, restored at start when no link opens
 * another notebook. A pristine notebook (welcome cells, empty cells) is not kept.
 */

export const STORAGE_KEY = 'cascad.notebook';
const SAVE_DELAY_MS = 800;

interface Stored {
  savedAt: string;
  data: { type?: string; cells?: unknown[] };
}

/** The saved notebook, or null when there is none or it is unreadable. */
export function readSavedNotebook(storage: Pick<Storage, 'getItem'> = localStorage): Stored['data'] | null {
  try {
    const stored = JSON.parse(storage.getItem(STORAGE_KEY) ?? 'null') as Stored | null;
    return stored && stored.data && Array.isArray(stored.data.cells) && stored.data.cells.length > 0 ? stored.data : null;
  } catch {
    return null;
  }
}

/** Open the saved notebook, if any; true when it was opened. */
export function restoreSavedNotebook(): boolean {
  const data = readSavedNotebook();
  if (!data) return false;
  try {
    return window.loadNotebookData(data, { confirmed: true });
  } catch {
    return false;
  }
}

function save(): void {
  try {
    if (window.isNotebookPristine()) localStorage.removeItem(STORAGE_KEY);
    else localStorage.setItem(STORAGE_KEY, JSON.stringify({ savedAt: new Date().toISOString(), data: window.buildNotebookData() as Stored['data'] }));
  } catch {
    // Storage full or unavailable, or a cell that cannot be read yet: keep the previous copy.
  }
}

/** Save the notebook after each change (debounced) and when the page is hidden. */
export function watchNotebook(): void {
  const notebook = document.getElementById('notebook');
  if (!notebook) return;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const schedule = (): void => {
    clearTimeout(timer);
    timer = setTimeout(save, SAVE_DELAY_MS);
  };
  // Typing (math fields and text areas), sliders, and cells added, removed, moved or changed.
  notebook.addEventListener('input', schedule, true);
  notebook.addEventListener('slider-change', schedule, true);
  new MutationObserver(schedule).observe(notebook, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['data-type', 'data-mode', 'data-hidden', 'data-disabled', 'data-locked'],
  });
  addEventListener('pagehide', () => {
    clearTimeout(timer);
    save();
  });
}
