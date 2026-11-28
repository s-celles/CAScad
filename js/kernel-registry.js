'use strict';

// Kernel Registry — central abstraction layer for computation kernels
// Each kernel implements: { id, label, available, evaluate(expr, cellType), getCommands(), getHelp(cmd) }

var KernelRegistry = (function() {
  var _kernels = {};
  var _active = null;

  return {
    register: function(kernel) {
      if (!kernel || !kernel.id) throw new Error('Kernel must have an id');
      _kernels[kernel.id] = kernel;
      // Set first registered kernel as active if none set
      if (!_active) _active = kernel;
    },

    get: function(id) {
      return _kernels[id];
    },

    list: function() {
      return Object.values(_kernels);
    },

    get active() {
      return _active;
    },

    setActive: function(kernelId, opts) {
      opts = opts || {};
      var kernel = _kernels[kernelId];
      if (!kernel) {
        console.error('Kernel not found:', kernelId);
        return false;
      }
      if (!kernel.available) {
        console.error('Kernel not available:', kernelId);
        return false;
      }
      if (_active && _active.id === kernelId) return true; // already active

      // Switching from the selector starts a new notebook: ask first (FILE-004)
      if (!opts.silent && typeof confirmReplaceNotebook === 'function' && !confirmReplaceNotebook()) {
        var selector = document.getElementById('kernel-select');
        if (selector && _active) selector.value = _active.id;
        return false;
      }

      _active = kernel;
      currentKernel = kernelId;

      // Save preference to localStorage
      localStorage.setItem('cascad-default-kernel', kernelId);
      defaultKernel = kernelId;

      // Reset notebook to welcome cell unless called from loadNotebookData
      if (!opts.silent) {
        if (typeof clearNotebook === 'function') {
          clearNotebook();
        }
        if (typeof showWelcomeNotebook === 'function') showWelcomeNotebook();
      }

      // Update kernel selector UI if present
      var sel = document.getElementById('kernel-select');
      if (sel) sel.value = kernelId;

      // Update status indicator and the selector
      refreshLabels();

      return true;
    },

    _updateStatusIndicator: _updateStatusIndicator,
    refreshLabels: refreshLabels
  };

  function _tr(key, fallback) {
    return typeof t === 'function' ? t(key) : fallback;
  }

  /** "Giac 2.1.0", "Compute Engine 0.169.2", or the name alone while the version is unknown (KRN-007). */
  function nameWithVersion(kernel) {
    var info = kernel.versionInfo ? kernel.versionInfo() : null;
    var name = _tr(kernel.label, kernel.label);
    return info && info.version ? name + ' ' + info.version : name;
  }

  /** Header status of the active kernel: loading, ready with its version, or error (KRN-005, KRN-007). */
  function _updateStatusIndicator() {
    var statusEl = document.getElementById('giac-status');
    if (!statusEl || !_active) return;
    var dot = statusEl.querySelector('.dot');
    var text = statusEl.querySelector('.text');
    var info = _active.versionInfo ? _active.versionInfo() : null;
    statusEl.classList.remove('ready', 'error');
    if (_active.failed) {
      dot.classList.remove('ready', 'loading');
      statusEl.classList.add('error');
      text.textContent = _tr('giacError', 'Giac error');
      statusEl.removeAttribute('title');
    } else if (_active.available) {
      dot.classList.add('ready');
      dot.classList.remove('loading');
      statusEl.classList.add('ready');
      text.textContent = nameWithVersion(_active) + ' \u2713';
      if (info && info.detail) statusEl.title = info.detail; else statusEl.removeAttribute('title');
    } else {
      dot.classList.remove('ready');
      dot.classList.add('loading');
      text.textContent = _active.id === 'giac-js' ? _tr('giacLoading', 'Loading Giac…') : nameWithVersion(_active) + '…';
      statusEl.removeAttribute('title');
    }
  }

  /** Kernel selector: each kernel with its version, or marked unavailable; and the header (KRN-007). */
  function refreshLabels() {
    var sel = document.getElementById('kernel-select');
    if (sel) {
      Object.values(_kernels).forEach(function(kernel) {
        var opt = sel.querySelector('option[value="' + kernel.id + '"]');
        if (!opt) return;
        var info = kernel.versionInfo ? kernel.versionInfo() : null;
        var unavailable = !kernel.available && kernel.id !== 'giac-js';
        opt.textContent = nameWithVersion(kernel) + (unavailable ? ' (' + _tr('kernelUnavailable', 'unavailable') + ')' : '');
        opt.disabled = unavailable;
        if (info && info.detail) opt.title = info.detail;
      });
      if (_active) sel.value = _active.id;
    }
    _updateStatusIndicator();
  }
})();
