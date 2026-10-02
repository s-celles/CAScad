/** Translations come from the plain scripts (js/i18n.js and js/i18n/*.js). */

/** The translation of `key`, with `{name}` placeholders replaced by `params`. */
export function t(key: string, params: Record<string, string | number> = {}): string {
  const text = typeof window.t === 'function' ? window.t(key) : key;
  return text.replace(/\{(\w+)\}/g, (match, name: string) => (name in params ? String(params[name]) : match));
}
