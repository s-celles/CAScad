/**
 * The editor of Giac cells: Giac text with inline math fields (MATH-006…008).
 *
 * A cell's text is plain Giac source in which `⟦…⟧` holds a formula typed in a
 * MathLive field, stored as the LaTeX typed (e.g. `factor(⟦x^{6}-1⟧, x)`). The
 * editor is CodeMirror 6; each `⟦…⟧` is shown as a live <math-field> that the
 * caret treats as one unit. When the field is left, its LaTeX is written back
 * into the text. At run time each `⟦L⟧` becomes `(L in the kernel's syntax)`
 * (`expandInlineMath`, js/mathjson-giac.js).
 *
 * The cell's <textarea> stays in the page, hidden, as the source of truth for
 * the rest of the app: its `value`, `readOnly` and `focus` are routed to the
 * editor, it receives the `input` events and the cell's key handler. The design
 * follows GiacSlate's inline-math editor (JuliaGiac/GiacSlate.jl).
 */
import { Compartment, EditorState, type Range } from '@codemirror/state';
import { Decoration, type DecorationSet, EditorView, keymap, placeholder, ViewPlugin, type ViewUpdate, WidgetType } from '@codemirror/view';
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';

export const OPEN = '⟦';
export const CLOSE = '⟧';
/** A formula: no nested brackets, no line break (MathLive LaTeX is one line). */
const FORMULA = /⟦([^⟦⟧\n]*)⟧/g;
const FORMULA_AT = /^⟦([^⟦⟧\n]*)⟧/;

/** What the editor needs from the plain scripts of js/. */
export interface MixedEditorHooks {
  /** Giac source → LaTeX, to turn a selection into a field (null if it cannot). */
  giacToLatex?: (src: string) => string | null;
  /** The reason a LaTeX formula is not valid math, or null. */
  latexError?: (latex: string) => string | null;
  /** CAS shortcuts and menu of CAScad's math fields. */
  configureMathField?: (mf: HTMLElement) => void;
  /** Label of the insert button. */
  insertTitle?: string;
}

type MathField = HTMLElement & {
  value: string;
  getValue(format?: string): string;
  executeCommand(command: string): boolean;
};

/** Clean LaTeX for storage inside ⟦…⟧. */
const storable = (latex: string): string => latex.replace(/[⟦⟧]/g, '').replace(/\s*\n\s*/g, ' ').trim();

class FormulaWidget extends WidgetType {
  constructor(readonly latex: string, readonly from: number, readonly hooks: MixedEditorHooks, readonly focusOnMount: boolean) {
    super();
  }

  override eq(other: FormulaWidget): boolean {
    return other.latex === this.latex && other.from === this.from;
  }

  override ignoreEvent(): boolean {
    return true;
  }

  toDOM(view: EditorView): HTMLElement {
    const wrap = document.createElement('span');
    wrap.className = 'cascad-formula';
    const mf = document.createElement('math-field') as MathField;
    mf.value = this.latex;
    const flag = (latex: string): void => {
      const error = this.hooks.latexError?.(latex) ?? null;
      wrap.classList.toggle('cascad-formula-error', error !== null);
      if (error) wrap.title = error; else wrap.removeAttribute('title');
    };
    flag(this.latex);

    /** The range of this formula's LaTeX in the document, read from the DOM position. */
    const inner = (): { from: number; to: number } | null => {
      if (!wrap.isConnected) return null;
      let start: number;
      try { start = view.posAtDOM(wrap); } catch { return null; }
      const m = FORMULA_AT.exec(view.state.doc.sliceString(start, Math.min(start + 4096, view.state.doc.length)));
      return m ? { from: start + OPEN.length, to: start + OPEN.length + m[1]!.length } : null;
    };
    /** Write the field's LaTeX back; optionally put the caret before or after the formula. */
    const commit = (direction?: 'before' | 'after'): void => {
      const r = inner();
      if (!r) return;
      const latex = storable(mf.getValue('latex-unstyled'));
      flag(latex);
      const changed = latex !== view.state.doc.sliceString(r.from, r.to);
      const caret = direction === 'before' ? r.from - OPEN.length : direction === 'after' ? r.from + latex.length + CLOSE.length : undefined;
      if (!changed && caret === undefined) return;
      view.dispatch({
        ...(changed ? { changes: { from: r.from, to: r.to, insert: latex } } : {}),
        ...(caret !== undefined ? { selection: { anchor: caret } } : {}),
      });
      if (caret !== undefined) view.focus();
    };
    let leaving = false;
    const leave = (direction: 'before' | 'after'): void => {
      leaving = true;
      commit(direction);
    };

    mf.addEventListener('keydown', (e) => {
      // Run keys: write the formula back, then let the cell run (Shift/Ctrl+Enter)
      if (e.key === 'Enter' && (e.shiftKey || e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        e.stopPropagation();
        leave('after');
        view.contentDOM.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', shiftKey: e.shiftKey, ctrlKey: e.ctrlKey, metaKey: e.metaKey, bubbles: true, cancelable: true }));
        return;
      }
      if (e.key === 'Enter' || e.key === 'Escape' || e.key === 'Tab') {
        e.preventDefault();
        e.stopPropagation();
        leave(e.shiftKey ? 'before' : 'after');
      }
    }, true);
    // MathLive: the caret went past the start or the end of the field
    mf.addEventListener('move-out', (e) => {
      const d = (e as CustomEvent<{ direction?: string }>).detail?.direction;
      leave(d === 'backward' || d === 'upward' ? 'before' : 'after');
    });
    mf.addEventListener('input', () => flag(storable(mf.getValue('latex-unstyled'))));
    mf.addEventListener('focusout', () => {
      if (leaving) leaving = false;
      else commit();
    });
    wrap.appendChild(mf);
    requestAnimationFrame(() => {
      if (!mf.isConnected) return;
      this.hooks.configureMathField?.(mf);
      if (this.focusOnMount) mf.focus();
    });
    return wrap;
  }
}

/** Where the editor should focus the formula it is about to create (a document position). */
let focusAt = -1;

function decorations(view: EditorView, hooks: MixedEditorHooks): DecorationSet {
  const ranges: Range<Decoration>[] = [];
  const text = view.state.doc.toString();
  FORMULA.lastIndex = 0;
  for (let m = FORMULA.exec(text); m; m = FORMULA.exec(text)) {
    const from = m.index;
    const focus = from === focusAt;
    if (focus) focusAt = -1;
    ranges.push(Decoration.replace({ widget: new FormulaWidget(m[1]!, from, hooks, focus) }).range(from, from + m[0].length));
  }
  return Decoration.set(ranges, true);
}

/** The formula that starts (or ends) at `pos`, if any. */
function formulaAt(view: EditorView, plugin: ViewPlugin<{ decorations: DecorationSet }>, pos: number, side: 'start' | 'end'): { from: number; to: number } | null {
  let found: { from: number; to: number } | null = null;
  view.plugin(plugin)?.decorations.between(0, view.state.doc.length, (from, to) => {
    if ((side === 'start' ? from : to) === pos) { found = { from, to }; return false; }
    return undefined;
  });
  return found;
}

/** Turn the selection into a formula, or insert an empty one at the caret (Ctrl/⌘+M, the ∫ button). */
export function insertFormula(view: EditorView, hooks: MixedEditorHooks): boolean {
  const sel = view.state.selection.main;
  const selected = view.state.sliceDoc(sel.from, sel.to);
  const latex = selected.trim() ? storable(hooks.giacToLatex?.(selected) ?? selected) : '';
  focusAt = sel.from;
  view.dispatch({ changes: { from: sel.from, to: sel.to, insert: OPEN + latex + CLOSE } });
  view.focus();
  return true;
}

/**
 * Replace a cell's <textarea> by the mixed editor. The textarea stays (hidden)
 * as the source of truth: `value`, `readOnly` and `focus` act on the editor.
 */
export function attachMixedEditor(ta: HTMLTextAreaElement, hooks: MixedEditorHooks = {}): EditorView {
  const editable = new Compartment();
  let fromOutside = false;

  const plugin: ViewPlugin<{ decorations: DecorationSet }> = ViewPlugin.fromClass(class {
    decorations: DecorationSet;
    constructor(view: EditorView) { this.decorations = decorations(view, hooks); }
    update(u: ViewUpdate) { if (u.docChanged || u.viewportChanged) this.decorations = decorations(u.view, hooks); }
  }, { decorations: (v) => v.decorations });

  const deleteFormula = (side: 'start' | 'end') => (view: EditorView): boolean => {
    const sel = view.state.selection.main;
    if (!sel.empty) return false;
    const r = formulaAt(view, plugin, sel.head, side);
    if (!r) return false;
    view.dispatch({ changes: { from: r.from, to: r.to }, selection: { anchor: r.from } });
    return true;
  };
  const enterFormula = (side: 'start' | 'end') => (view: EditorView): boolean => {
    const sel = view.state.selection.main;
    if (!sel.empty) return false;
    const r = formulaAt(view, plugin, sel.head, side);
    if (!r) return false;
    const mf = [...view.dom.querySelectorAll<HTMLElement>('.cascad-formula')].find((w) => {
      try { return view.posAtDOM(w) === r.from; } catch { return false; }
    })?.querySelector('math-field') as MathField | null;
    if (!mf) return false;
    mf.focus();
    requestAnimationFrame(() => { try { mf.executeCommand(side === 'start' ? 'moveToMathfieldStart' : 'moveToMathfieldEnd'); } catch { /* not ready */ } });
    return true;
  };

  const view = new EditorView({
    state: EditorState.create({
      doc: ta.value,
      extensions: [
        history(),
        keymap.of([
          { key: 'Mod-m', run: (v) => insertFormula(v, hooks) },
          { key: 'Backspace', run: deleteFormula('end') },
          { key: 'Delete', run: deleteFormula('start') },
          { key: 'ArrowRight', run: enterFormula('start') },
          { key: 'ArrowLeft', run: enterFormula('end') },
          ...historyKeymap,
          ...defaultKeymap,
        ]),
        plugin,
        EditorView.atomicRanges.of((v) => v.plugin(plugin)?.decorations ?? Decoration.none),
        EditorView.lineWrapping,
        placeholder(ta.placeholder),
        editable.of([EditorView.editable.of(!ta.readOnly), EditorState.readOnly.of(ta.readOnly)]),
        EditorView.updateListener.of((u) => {
          if (u.docChanged && !fromOutside) ta.dispatchEvent(new Event('input', { bubbles: true }));
        }),
        // The cell's keys (Shift+Enter runs…) are the textarea's listeners
        EditorView.domEventHandlers({
          keydown: (e) => {
            if ((e.target as HTMLElement).closest?.('.cascad-formula')) return false;
            const copy = new KeyboardEvent('keydown', { key: e.key, code: e.code, shiftKey: e.shiftKey, ctrlKey: e.ctrlKey, metaKey: e.metaKey, altKey: e.altKey, cancelable: true });
            ta.dispatchEvent(copy);
            if (copy.defaultPrevented) { e.preventDefault(); return true; }
            return false;
          },
        }),
      ],
    }),
  });

  const box = document.createElement('div');
  box.className = 'cascad-mixed-editor';
  const insert = document.createElement('button');
  insert.type = 'button';
  insert.className = 'cascad-insert-formula';
  insert.textContent = '∫';
  insert.title = hooks.insertTitle ?? 'Insert a math field (Ctrl+M)';
  insert.addEventListener('mousedown', (e) => e.preventDefault()); // keep the caret where it is
  insert.addEventListener('click', () => { if (!ta.readOnly) insertFormula(view, hooks); });
  box.append(view.dom, insert);
  ta.after(box);
  ta.hidden = true;

  Object.defineProperty(ta, 'value', {
    configurable: true,
    get: () => view.state.doc.toString(),
    set: (v: unknown) => {
      const text = v == null ? '' : String(v);
      if (text === view.state.doc.toString()) return;
      fromOutside = true;
      try { view.dispatch({ changes: { from: 0, to: view.state.doc.length, insert: text } }); } finally { fromOutside = false; }
    },
  });
  let readOnly = ta.readOnly;
  Object.defineProperty(ta, 'readOnly', {
    configurable: true,
    get: () => readOnly,
    set: (v: unknown) => {
      readOnly = !!v;
      box.classList.toggle('read-only', readOnly);
      view.dispatch({ effects: editable.reconfigure([EditorView.editable.of(!readOnly), EditorState.readOnly.of(readOnly)]) });
    },
  });
  ta.focus = () => view.focus();
  (ta as HTMLTextAreaElement & { cascadEditor?: EditorView }).cascadEditor = view;
  return view;
}
