'use strict';

// Giac engine loader (index.html): giac-wasm, GIAC compiled to WebAssembly and
// served from giac-wasm/<GIAC_WASM_VERSION>/ by the build, or the asm.js build
// giac.js as a fallback where giac-wasm cannot be loaded, or with ?giac=asm.
// window._giacEngineReady resolves to { engine, version, caseval } (js/giac-init.js).
// GIAC's messages go to window._giacMessages while window._giacCapture is on
// (js/execution.js).

window._giacMessages = [];
window._giacCapture = false;
function _giacMessage(type, text) {
  if (window._giacCapture) { window._giacMessages.push({ type: type, text: text }); return; }
  if (text) console.log('giac:', text);
}

/**
 * caseval() over a giac-wasm session, with the contract of the asm.js caseval:
 * the result as text, an error as "GIAC_ERROR: <message>"; GIAC's messages go
 * to onMessage(type, text).
 */
function giacWasmCaseval(giac, onMessage) {
  return function(expr) {
    try {
      var r = giac.evalWithMessages(expr);
      r.messages.forEach(function(m) { if (m) onMessage('info', m); });
      return r.result;
    } catch (e) {
      if (!e || e.name !== 'GiacError') throw e;
      (e.messages || []).forEach(function(m) { if (m) onMessage('warn', m); });
      return 'GIAC_ERROR: ' + e.message;
    }
  };
}

/** giac-wasm: GIAC compiled to WebAssembly (JuliaGiac/giac, npm/). */
function _loadGiacWasm() {
  // Relative to the page (a classic script's import() would resolve from js/)
  var url = new URL('giac-wasm/' + GIAC_WASM_VERSION + '/src/index.mjs', document.baseURI).href;
  return import(url).then(function(mod) {
    return mod.loadGiac({ timeout: 30 });
  }).then(function(giac) {
    return {
      engine: 'giac-wasm',
      version: giac.version,
      giac: giac,
      caseval: giacWasmCaseval(giac, _giacMessage)
    };
  });
}

/** The asm.js build (giac.js), with the Module and UI objects it expects. */
function _loadGiacAsmJs() {
  return new Promise(function(resolve, reject) {
    window.Module = {
      canvas: document.getElementById('canvas'),
      preRun: [],
      postRun: [],
      print: function(text) { _giacMessage('info', text); },
      printErr: function(text) { _giacMessage('warn', text); },
      setStatus: function(text) { if (text) console.log('giac status:', text); },
      totalDependencies: 0,
      monitorRunDependencies: function(left) { this.totalDependencies = Math.max(this.totalDependencies, left); },
      onRuntimeInitialized: function() {
        window.Module.ready = true;
        resolve({ engine: 'giac.js', version: null, caseval: window.Module.cwrap('caseval', 'string', ['string']) });
      }
    };
    // giac.js references UI.* during some computations
    window.UI = {
      Datestart: Date.now(), disable3d: 0, warnpy: false, python_output: '',
      assistant_matr_maxrows: 100, assistant_matr_maxcols: 100,
      clean_for_html: function(s) { return s; },
      add_python_output: function(s) { window.UI.python_output += s; },
      set_config_width: function() {}, open_sheet: function() {}, sheet_recompute: function() {}, sheet_set_ij: function() {}
    };
    var script = document.createElement('script');
    script.src = 'giac.js';
    script.onerror = function() { reject(new Error('giac.js could not be loaded')); };
    document.head.appendChild(script);
  });
}

/** Starts loading the engine (called by index.html). */
function startGiacEngine() {
  window._giacEngineReady = /[?&]giac=asm\b/.test(location.search)
    ? _loadGiacAsmJs()
    : _loadGiacWasm().catch(function(e) {
        console.warn('giac-wasm could not be loaded, using giac.js (asm.js):', e);
        return _loadGiacAsmJs();
      });
}
