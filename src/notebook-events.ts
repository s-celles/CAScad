/**
 * Calls `onChange` (debounced) after any change of the notebook by the user:
 * typing in math fields and text areas, sliders, cells added, removed, moved,
 * or changed in type, mode or settings. Used by autosave and collaboration.
 */
export function onNotebookChange(onChange: () => void, delayMs: number): () => void {
  const notebook = document.getElementById('notebook');
  if (!notebook) return () => undefined;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const schedule = (): void => {
    clearTimeout(timer);
    timer = setTimeout(onChange, delayMs);
  };
  notebook.addEventListener('input', schedule, true);
  notebook.addEventListener('slider-change', schedule, true);
  const observer = new MutationObserver(schedule);
  observer.observe(notebook, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['data-type', 'data-mode', 'data-hidden', 'data-disabled', 'data-locked'],
  });
  return () => {
    clearTimeout(timer);
    notebook.removeEventListener('input', schedule, true);
    notebook.removeEventListener('slider-change', schedule, true);
    observer.disconnect();
  };
}
