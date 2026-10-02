'use strict';

// SECTION 10 — EXPORT / IMPORT
// ─────────────────────────────────────────────────────────────

function buildNotebookData() {
  return {
    version: 5,
    type: 'cascad-notebook',
    kernel: (typeof KernelRegistry !== 'undefined' && KernelRegistry.active) ? KernelRegistry.active.id : currentKernel,
    created: new Date().toISOString(),
    locale: currentLocale,
    reactiveMode: reactiveMode,
    cells: cells.map(c => {
      const el = c.element;
      const mode = el.dataset.mode || el.dataset.type;
      const mf = el.querySelector('math-field');
      const ta = el.querySelector('textarea');
      const cellInfo = cellVariableMap.get(c.id);
      const cell = {
        uid: el.dataset.uid,
        type: el.dataset.type,
        mode,
        defines: cellInfo ? cellInfo.defines : [],
        references: cellInfo ? cellInfo.references : [],
        hidden: el.dataset.hidden === 'true',
        disabled: el.dataset.disabled === 'true',
        locked: el.dataset.locked === 'true'
      };
      if (el.dataset.type === 'slider') {
        cell.params = (el._sliderParams || []).map(function(p) {
          var sp = el.querySelector('slider-param[name="' + p.name + '"]');
          return { name: p.name, label: p.label, min: p.min, max: p.max, step: p.step, value: sp ? sp.value : p.value };
        });
        cell.expression = el.dataset.expression || '';
        cell.plotType = el.dataset.plotType || 'plot';
      } else if (mode === 'math' && mf) {
        // The LaTeX as typed (setting MathJSON back would simplify it: 2+3 → 5)
        cell.latex = mf.value;
        cell.mathjson = mf.expression.json;
      } else {
        cell.content = ta ? ta.value : '';
      }
      return cell;
    })
  };
}

// ─── Cells as shared content (collaboration, COLLAB-002) ─────────────────

/** What is shared of a cell: content and settings, not outputs nor derived data. */
function cellSnapshot(el) {
  var type = el.dataset.type;
  var cell = { type: type };
  if (el.dataset.hidden === 'true') cell.hidden = true;
  if (el.dataset.disabled === 'true') cell.disabled = true;
  if (el.dataset.locked === 'true') cell.locked = true;
  if (type === 'slider') {
    cell.params = (el._sliderParams || []).map(function(p) {
      var sp = el.querySelector('slider-param[name="' + p.name + '"]');
      return { name: p.name, label: p.label, min: p.min, max: p.max, step: p.step, value: sp ? Number(sp.value) : p.value };
    });
    cell.expression = el.dataset.expression || '';
    cell.plotType = el.dataset.plotType || 'plot';
    return cell;
  }
  var mf = el.querySelector('math-field');
  var ta = el.querySelector('textarea');
  if (type === 'math') cell.mode = el.dataset.mode === 'raw' ? 'raw' : 'math';
  if (type === 'math' && cell.mode === 'math') cell.latex = mf ? mf.value : '';
  else cell.content = ta ? ta.value : '';
  return cell;
}

/** The open notebook as [{ uid, cell }], in order. */
function notebookCells() {
  return cells.map(function(c) { return { uid: c.element.dataset.uid, cell: cellSnapshot(c.element) }; });
}

function _sameJson(a, b) { return JSON.stringify(a) === JSON.stringify(b); }

/** Create a cell from a snapshot (appended; the caller orders the cells). */
function _cellFromSnapshot(uid, cell) {
  var opts = { uid: uid, hidden: cell.hidden === true, disabled: cell.disabled === true, locked: cell.locked === true };
  if (cell.type === 'slider') {
    return addCell('slider', '', '', null, null, Object.assign(opts, { params: cell.params || [], expression: cell.expression || '', plotType: cell.plotType || 'plot' }));
  }
  if (cell.type === 'math') {
    var id = addCell('math', cell.mode === 'math' ? (cell.latex || '') : '', '', null, null, opts);
    if (cell.mode === 'raw') {
      setCellMode(id, 'raw');
      var ta = document.getElementById(id).querySelector('textarea');
      if (ta) ta.value = cell.content || '';
    }
    return id;
  }
  return addCell(cell.type, '', cell.content || '', null, null, opts);
}

/** Set a text field's value, keeping the caret where it was when the field has the focus. */
function _setFieldValue(field, value) {
  if (field.value === value) return;
  var focused = document.activeElement === field;
  var start = field.selectionStart, end = field.selectionEnd;
  field.value = value;
  if (focused) field.setSelectionRange(Math.min(start, value.length), Math.min(end, value.length));
}

/**
 * Bring the open notebook to `list` ([{ uid, cell }]), as received from other
 * participants: cells are updated in place when possible (the caret of the
 * person typing stays put), created, removed and reordered; the cells that
 * changed are evaluated locally (COLLAB-003). Returns the changed cell ids.
 */
function applyNotebookCells(list) {
  var byUid = new Map(cells.map(function(c) { return [c.element.dataset.uid, c]; }));
  var wanted = new Set(list.map(function(item) { return item.uid; }));
  var changed = [];
  // Removed cells
  cells.slice().forEach(function(c) { if (!wanted.has(c.element.dataset.uid)) deleteCell(c.id); });
  list.forEach(function(item) {
    var existing = byUid.get(item.uid);
    var cell = item.cell;
    if (existing && document.getElementById(existing.id)) {
      var el = existing.element;
      var current = cellSnapshot(el);
      if (_sameJson(current, cell)) return;
      var sameKind = current.type === cell.type && current.type !== 'slider' && (current.mode || '') === (cell.mode || '');
      if (!sameKind) {
        deleteCell(existing.id);
        changed.push(_cellFromSnapshot(item.uid, cell));
        return;
      }
      // Same kind: update the content and settings in place
      var mf = el.querySelector('math-field');
      var ta = el.querySelector('textarea');
      if (cell.type === 'math' && cell.mode === 'math') {
        if (mf && mf.value !== (cell.latex || '')) mf.value = cell.latex || '';
      } else if (ta) {
        _setFieldValue(ta, cell.content || '');
      }
      if ((el.dataset.hidden === 'true') !== (cell.hidden === true)) toggleCellHidden(existing.id);
      if ((el.dataset.disabled === 'true') !== (cell.disabled === true)) toggleCellDisabled(existing.id);
      if ((el.dataset.locked === 'true') !== (cell.locked === true)) toggleCellLocked(existing.id);
      changed.push(existing.id);
    } else {
      changed.push(_cellFromSnapshot(item.uid, cell));
    }
  });
  // Order
  var order = list.map(function(item) { return item.uid; });
  var sorted = cells.slice().sort(function(a, b) { return order.indexOf(a.element.dataset.uid) - order.indexOf(b.element.dataset.uid); });
  var moved = sorted.some(function(c, i) { return c !== cells[i]; });
  if (moved) { cells = sorted; rebuildNotebookDOM(); }
  updateEmptyState();
  // Evaluate the changed cells here (outputs are not shared)
  changed.forEach(function(id) {
    var c = cells.find(function(x) { return x.id === id; });
    if (!c) return;
    if (c.type === 'text') renderTextCell(id);
    else if (c.element.dataset.disabled !== 'true') runSingleCell(id);
  });
  return changed;
}

function exportNotebook() {
  var data = buildNotebookData();
  var blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  var a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'notebook.cascad.json';
  a.click();
  URL.revokeObjectURL(a.href);
}

function _shareAsURL() {
  return compressNotebook().then(function(compressed) {
    var url = generateNotebookURL(compressed, false);
    return navigator.share({ title: 'CAScad Notebook', url: url });
  });
}

function shareNotebook() {
  if (!navigator.share) return;
  var data = buildNotebookData();
  var json = JSON.stringify(data, null, 2);
  var file = new File([json], 'notebook.cascad.json', { type: 'application/json' });
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    navigator.share({ title: 'CAScad Notebook', files: [file] }).catch(function(err) {
      if (err.name === 'AbortError') return;
      // File sharing denied — fall back to URL sharing
      _shareAsURL().catch(function() {});
    });
  } else {
    _shareAsURL().catch(function() {});
  }
}

function clearNotebook() {
  // Clear reactive graph
  cellVariableMap.forEach(function(info, cid) { unregisterCell(cid); });
  cellVariableMap.clear();
  variableOwnerMap.clear();
  // Preserve empty-notebook and notebook-footer elements
  var nb = document.getElementById('notebook');
  var empty = document.getElementById('empty-notebook');
  var footer = document.getElementById('notebook-footer');
  nb.innerHTML = '';
  if (empty) nb.appendChild(empty);
  if (footer) nb.appendChild(footer);
  cells = []; cellCounter = 0;
}

/** True when the open notebook holds nothing of the user's: no cell, the welcome cells, or empty cells. */
function isNotebookPristine() {
  return cells.every(function(c) {
    var el = c.element;
    if (el.dataset.i18nContent) return true;
    if (el.dataset.type === 'slider') return false;
    var ta = el.querySelector('textarea');
    var mf = el.querySelector('math-field');
    var value = ta ? ta.value.trim() : (mf ? mf.value.trim() : '');
    return value === '' || value === '![CAScad](assets/CAScad.png)';
  });
}

/** Ask before replacing a notebook the user has worked on (FILE-004); true to go ahead. */
function confirmReplaceNotebook() {
  return isNotebookPristine() || confirm(t('replaceNotebookConfirm'));
}

/**
 * Replace the open notebook with `data`. Asks first when the open notebook is not
 * pristine, unless `opts.confirmed`; returns false when the user declines.
 */
function loadNotebookData(data, opts) {
  opts = opts || {};
  if (!opts.confirmed && !confirmReplaceNotebook()) return false;
  // Restore kernel from notebook data (v5+), default to giac-js
  var notebookKernel = data.kernel || 'giac-js';
  if (typeof KernelRegistry !== 'undefined') {
    var k = KernelRegistry.get(notebookKernel);
    if (k && k.available) {
      KernelRegistry.setActive(notebookKernel, { silent: true });
    }
  }
  if (data.locale && LOCALES[data.locale]) setLocale(data.locale);
  clearNotebook();
  if (!opts.keepReactiveMode && data.reactiveMode !== undefined) toggleReactiveMode(data.reactiveMode);
  var fileVersion = data.version || 1;
  var cellItems = Array.isArray(data) ? data : data.cells;
  cellItems.forEach(function(item) {
    var cid;
    // Cell state flags (v4+, default false for older formats)
    var cellOpts = {
      uid: typeof item.uid === 'string' && /^[\w-]{4,64}$/.test(item.uid) ? item.uid : undefined,
      hidden: item.hidden === true,
      disabled: item.disabled === true,
      locked: item.locked === true
    };
    if (item.type === 'slider') {
      cid = addCell('slider', '', '', null, null, Object.assign(cellOpts, {
        params: item.params || [],
        expression: item.expression || '',
        plotType: item.plotType || 'plot'
      }));
    } else if (item.type === 'math') {
      if (typeof item.latex === 'string') {
        cid = addCell('math', item.latex, '', null, null, cellOpts);
      } else if (item.mathjson && fileVersion >= 3) {
        cid = addCell('math', '', '', item.mathjson, null, cellOpts);
      } else if (item.content) {
        // Pass LaTeX directly to math-field (mf.value) instead of going
        // through ce.parse() which corrupts some expressions (e.g. 0^+)
        cid = addCell('math', item.content, '', null, null, cellOpts);
      } else {
        cid = addCell('math', '', '', null, null, cellOpts);
      }
    } else {
      cid = addCell(item.type, '', item.content, null, null, cellOpts);
    }
    if (reactiveMode && observableModule && item.type !== 'text') {
      var expr = getGiacExpr(cid);
      if (expr) registerCell(cid, expr);
    }
  });
  updateEmptyState();
  // Auto-render text cells
  cells.forEach(function(c) { if (c.type === 'text') renderTextCell(c.id); });
  return true;
}

function importNotebook() {
  const inp = document.createElement('input');
  inp.type = 'file'; inp.accept = '.json,.giac.json,.cascad.json,.xcas.json';
  inp.onchange = (e) => {
    const f = e.target.files[0]; if (!f) return;
    const r = new FileReader();
    r.onload = (ev) => {
      try {
        var parsed = JSON.parse(ev.target.result);
        var validTypes = ['giac-notebook', 'xcas-notebook', 'cascad-notebook'];
        if (parsed.type && validTypes.indexOf(parsed.type) === -1) {
          alert(t('invalidJson'));
          return;
        }
        loadNotebookData(parsed);
      } catch(err) { alert(t('invalidJson')); }
    };
    r.readAsText(f);
  };
  inp.click();
}


// ─────────────────────────────────────────────────────────────
// SECTION 11 — UTILITIES
// ─────────────────────────────────────────────────────────────

/** Escape text for HTML, attribute values included (quotes too). */
function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
