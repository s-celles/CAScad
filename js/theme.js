'use strict';

// ═══════════════════════════════════════════════════
// Theme — same behaviour as QRShare: the header button cycles
// auto (system) → light → dark. Loaded in <head> so the theme
// applies before first paint.
// ═══════════════════════════════════════════════════

var THEME_CYCLE = ['auto', 'light', 'dark'];
var THEME_ICONS = { auto: '◐', light: '☀', dark: '☾' };
var THEME_STORAGE_KEY = 'cascad-theme';
var _themeDarkQuery = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;

function _loadThemePreference() {
  try {
    var stored = localStorage.getItem(THEME_STORAGE_KEY);
    return stored === 'light' || stored === 'dark' ? stored : 'auto';
  } catch (e) {
    return 'auto';
  }
}

var themePreference = _loadThemePreference();

/** The theme actually shown: 'light' or 'dark'. */
function getEffectiveTheme() {
  if (themePreference !== 'auto') return themePreference;
  return _themeDarkQuery && _themeDarkQuery.matches ? 'dark' : 'light';
}

function applyTheme() {
  document.documentElement.setAttribute('data-theme', getEffectiveTheme());
  updateThemeButton();
  // Mermaid bakes colours into its SVG: re-render the flow diagram
  if (typeof refreshDagDiagram === 'function') refreshDagDiagram();
}

function updateThemeButton() {
  var btn = document.getElementById('theme-toggle');
  if (!btn) return;
  var tr = typeof t === 'function' ? t : function(k) { return k; };
  var modeKey = 'theme' + themePreference.charAt(0).toUpperCase() + themePreference.slice(1);
  var label = tr('themeButton') + ': ' + tr(modeKey);
  btn.textContent = THEME_ICONS[themePreference];
  btn.title = label;
  btn.setAttribute('aria-label', label);
}

function toggleTheme() {
  themePreference = THEME_CYCLE[(THEME_CYCLE.indexOf(themePreference) + 1) % THEME_CYCLE.length];
  try { localStorage.setItem(THEME_STORAGE_KEY, themePreference); } catch (e) { /* private mode */ }
  applyTheme();
}

if (_themeDarkQuery) {
  var _onSystemThemeChange = function() { if (themePreference === 'auto') applyTheme(); };
  if (_themeDarkQuery.addEventListener) _themeDarkQuery.addEventListener('change', _onSystemThemeChange);
  else if (_themeDarkQuery.addListener) _themeDarkQuery.addListener(_onSystemThemeChange);
}

document.documentElement.setAttribute('data-theme', getEffectiveTheme());
document.addEventListener('DOMContentLoaded', updateThemeButton);
