/**
 * The requirements specification (docs/requirements.md, EARS notation), shown
 * in the app from the About window. Bundled at build time: it works offline.
 */
import { marked } from 'marked';
import requirements from '../docs/requirements.md' with { type: 'text' };
import { button, h, openDialog } from './dom';
import { t } from './i18n';

export const REQUIREMENTS_SOURCE_URL = 'https://github.com/s-celles/CAScad/blob/main/docs/requirements.md';

/** The specification as HTML, without its YAML front matter; links open in a new tab. */
export function requirementsHtml(markdown: string = requirements): string {
  const body = markdown.replace(/^---\n[\s\S]*?\n---\n/, '');
  const html = marked.parse(body, { gfm: true, async: false });
  return html.replace(/<a href="(https?:[^"]+)"/g, '<a href="$1" target="_blank" rel="noopener"');
}

/** Open the requirements in a window over the notebook. */
export function showRequirements(): void {
  if (document.querySelector('.docs-dialog')) return;
  const dialog = h('dialog', { class: 'dialog docs-dialog', 'aria-labelledby': 'docs-title' });
  const content = h('div', { class: 'docs-content' });
  // Repository content, bundled at build time (no user input).
  content.innerHTML = requirementsHtml();
  const closeButton = button(t('commonClose'), () => dialog.close(), { className: 'primary' });
  dialog.append(
    h('h2', { id: 'docs-title' }, t('requirementsTitle')),
    content,
    h(
      'div',
      { class: 'dialog-actions' },
      h('a', { href: REQUIREMENTS_SOURCE_URL, target: '_blank', rel: 'noopener', class: 'docs-source' }, t('requirementsSource')),
      closeButton,
    ),
  );
  openDialog(dialog);
  closeButton.focus();
}
