'use strict';

// Giac Kernel Adapter
// Wraps the existing caseval() + GIAC_HELP infrastructure behind the Kernel interface

var _giacVersionCache = null;

var GiacKernel = {
  id: 'giac-js',
  label: 'kernelGiac',
  available: false, // set to true by initGiac() once the engine is ready

  /**
   * GIAC's version ("2.1.0") and the build that runs it (KRN-007), once ready:
   * giac-wasm reports it; for giac.js (asm.js), it is read from version().
   */
  versionInfo: function() {
    var engine = window.giacEngine;
    if (!this.available || !engine) return null;
    if (!_giacVersionCache) {
      var version = engine.version;
      if (!version && typeof caseval === 'function') {
        try {
          var m = /giac\s+([0-9][\w.\-]*)/i.exec(caseval('version()'));
          if (m) version = m[1];
        } catch (e) { /* unknown */ }
      }
      var detail = engine.engine === 'giac-wasm'
        ? 'giac-wasm ' + (typeof GIAC_WASM_VERSION !== 'undefined' ? GIAC_WASM_VERSION : '') + ' (WebAssembly)'
        : 'giac.js (asm.js)';
      _giacVersionCache = { version: version || null, detail: detail.replace(/\s+\(/, ' (') };
    }
    return _giacVersionCache;
  },

  evaluate: function(expr, cellType) {
    if (!this.available || typeof caseval !== 'function') {
      throw new Error('GIAC kernel is not ready');
    }
    // For raw cells: pass expression directly to caseval
    if (cellType === 'raw') {
      giacCaptureStart();
      var raw = caseval(expr);
      return raw;
    }
    // For math cells: expression has already been converted to GIAC syntax
    // by getGiacExpr() (mathJsonToGiac or latexToGiac)
    giacCaptureStart();
    var result = caseval(expr);
    return result;
  },

  // LaTeX rendering helper for GIAC results
  renderLatex: function(expr) {
    if (!this.available || typeof caseval !== 'function') return '';
    try {
      var latex = caseval('latex(' + expr + ')');
      return latex ? latex.replace(/^"|"$/g, '') : '';
    } catch(e) { return ''; }
  },

  /** A math field's LaTeX in Giac syntax (EXE-011). */
  formulaToSource: function(latex) {
    return typeof latexToGiac === 'function' ? latexToGiac(latex) : latex;
  },

  /** Giac source as LaTeX, without evaluating it, or null (MATH-007). */
  sourceToLatex: function(source) {
    return typeof giacSourceToLatex === 'function' ? giacSourceToLatex(source) : null;
  },

  getCommands: function() {
    if (typeof COMMAND_MENU !== 'undefined' && COMMAND_MENU.allCommands) {
      return COMMAND_MENU.allCommands.filter(function(c) { return c.length > 0; });
    }
    if (typeof GIAC_HELP !== 'undefined') return Object.keys(GIAC_HELP.cmds).sort();
    return [];
  },

  getHelp: function(cmd) {
    if (typeof getHelp === 'function') return getHelp(cmd);
    return null;
  }
};

// Register with KernelRegistry
KernelRegistry.register(GiacKernel);
