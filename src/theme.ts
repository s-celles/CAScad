// Theme — same behaviour as QRShare: the header button cycles
// auto (system) → light → dark. Bundled to js/theme.js and loaded in <head>
// so the theme applies before first paint.

export type Theme = 'auto' | 'light' | 'dark';

const THEME_CYCLE: Theme[] = ['auto', 'light', 'dark'];
const THEME_ICONS: Record<Theme, string> = { auto: '◐', light: '☀', dark: '☾' };
const THEME_STORAGE_KEY = 'cascad-theme';

/** Next preference for the header button: auto → light → dark → auto. */
export function nextTheme(current: Theme): Theme {
  return THEME_CYCLE[(THEME_CYCLE.indexOf(current) + 1) % THEME_CYCLE.length]!;
}

/** The theme actually shown for a preference and the system setting. */
export function resolveTheme(preference: Theme, systemPrefersDark: boolean): 'light' | 'dark' {
  return preference === 'auto' ? (systemPrefersDark ? 'dark' : 'light') : preference;
}

/** The stored preference ('auto' when missing, invalid or unreadable). */
export function parseTheme(stored: string | null): Theme {
  return stored === 'light' || stored === 'dark' ? stored : 'auto';
}

function install(): void {
  const darkQuery = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
  let preference: Theme;
  try {
    preference = parseTheme(localStorage.getItem(THEME_STORAGE_KEY));
  } catch {
    preference = 'auto';
  }

  const getEffectiveTheme = (): 'light' | 'dark' => resolveTheme(preference, !!darkQuery?.matches);

  const updateThemeButton = (): void => {
    const btn = document.getElementById('theme-toggle');
    if (!btn) return;
    const tr = typeof window.t === 'function' ? window.t : (k: string) => k;
    const modeKey = 'theme' + preference.charAt(0).toUpperCase() + preference.slice(1);
    const label = tr('themeButton') + ': ' + tr(modeKey);
    btn.textContent = THEME_ICONS[preference];
    btn.title = label;
    btn.setAttribute('aria-label', label);
  };

  const applyTheme = (): void => {
    document.documentElement.setAttribute('data-theme', getEffectiveTheme());
    updateThemeButton();
    // Mermaid bakes colours into its SVG: re-render the flow diagram
    if (typeof window.refreshDagDiagram === 'function') void window.refreshDagDiagram();
  };

  const toggleTheme = (): void => {
    preference = nextTheme(preference);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, preference);
    } catch {
      /* private mode */
    }
    applyTheme();
  };

  darkQuery?.addEventListener('change', () => {
    if (preference === 'auto') applyTheme();
  });

  // Used by inline handlers and by the plain scripts in js/.
  Object.assign(window, { toggleTheme, updateThemeButton, getEffectiveTheme });

  document.documentElement.setAttribute('data-theme', getEffectiveTheme());
  document.addEventListener('DOMContentLoaded', updateThemeButton);
}

if (typeof window !== 'undefined' && typeof document !== 'undefined') install();
