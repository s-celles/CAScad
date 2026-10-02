/**
 * The documentation window, as in QRShare: an index of the docs/ pages, and
 * each page rendered in the app, with the list of pages beside it. It opens at
 * #/docs (index) or #/docs?page=<slug>[&section=<anchor>], so pages can be
 * linked from the README; it works offline (bundled).
 */
import { DOC_GROUPS, DOC_PAGES, DOCS_SOURCE_URL, docLanguage, docLinkResolver, docRoute, parseDocRoute, type DocLang, type DocPage } from './docs';
import { button, h } from './dom';
import { t } from './i18n';
import { markdownToHtml } from './markdown';

let dialog: HTMLDialogElement | null = null;

function nav(current?: DocPage): HTMLElement {
  return h(
    'nav',
    { class: 'docs-nav', 'aria-label': t('docsNavLabel') },
    ...DOC_GROUPS.map((group) =>
      h(
        'div',
        { class: 'docs-nav-group' },
        h('p', { class: 'docs-nav-title' }, t(`docsGroup_${group}`)),
        h(
          'ul',
          {},
          ...DOC_PAGES.filter((page) => page.group === group).map((page) =>
            h('li', {}, h('a', { href: docRoute(page.slug), 'aria-current': page === current ? 'page' : undefined }, t(`docsPage_${page.slug}`))),
          ),
        ),
      ),
    ),
  );
}

function index(): HTMLElement {
  return h(
    'div',
    { class: 'docs-index' },
    h('p', { class: 'docs-intro' }, t('docsIntro')),
    ...DOC_GROUPS.map((group) =>
      h(
        'section',
        {},
        h('h3', {}, t(`docsGroup_${group}`)),
        h(
          'div',
          { class: 'docs-cards' },
          ...DOC_PAGES.filter((page) => page.group === group).map((page) =>
            h(
              'a',
              { class: 'docs-card', href: docRoute(page.slug) },
              h('span', { class: 'docs-card-title' }, t(`docsPage_${page.slug}`)),
              h('span', { class: 'docs-card-desc' }, t(`docsDesc_${page.slug}`)),
            ),
          ),
        ),
      ),
    ),
  );
}

/** The interface language (set by js/i18n.js on <html lang>). */
const uiLang = (): string => document.documentElement.lang || 'en';

function article(page: DocPage, lang: DocLang): HTMLElement {
  const content = h('div', { class: 'docs-content' });
  // Repository content, bundled at build time; raw HTML in it is escaped.
  content.innerHTML = markdownToHtml(page.content[lang] ?? page.content.en, docLinkResolver(page, lang));
  return h(
    'article',
    { class: 'docs-article', lang },
    lang === uiLang().slice(0, 2) || uiLang().startsWith('en') ? null : h('p', { class: 'docs-lang-note' }, t('docsEnglishOnly')),
    content,
    h('p', { class: 'docs-source' }, h('a', { href: `${DOCS_SOURCE_URL}/${page.files[lang] ?? page.files.en}`, target: '_blank', rel: 'noopener' }, t('docsOnGitHub'))),
  );
}

/** Show the index, a page, or a section of a page (in `lang`, or the interface language); opens the window if needed. */
export function showDocs(slug?: string, section?: string, lang?: string): void {
  const route = parseDocRoute(docRoute(slug, section))!;
  if (!dialog) {
    dialog = h('dialog', { class: 'dialog docs-dialog', 'aria-labelledby': 'docs-title' });
    dialog.addEventListener('close', () => {
      dialog?.remove();
      dialog = null;
      if (parseDocRoute(location.hash)) history.replaceState(null, '', location.pathname + location.search);
    });
    // Links between pages stay in this window.
    dialog.addEventListener('click', (e) => {
      const a = (e.target as HTMLElement).closest('a');
      const target = a?.getAttribute('href');
      const next = target ? parseDocRoute(target) : null;
      if (!next) return;
      e.preventDefault();
      showDocs(next.page?.slug, next.section, next.lang);
    });
    document.body.append(dialog);
    if (typeof dialog.showModal === 'function') dialog.showModal();
    else dialog.setAttribute('open', '');
  }
  const page = route.page;
  const header = h(
    'div',
    { class: 'docs-header' },
    page ? h('a', { class: 'docs-back', href: docRoute() }, `← ${t('docsTitle')}`) : h('h2', { id: 'docs-title' }, t('docsTitle')),
    button(t('commonClose'), () => dialog?.close(), { className: 'docs-close' }),
  );
  if (page) header.firstElementChild!.id = 'docs-title';
  const shown = page ? docLanguage(page, lang ?? uiLang()) : undefined;
  dialog.replaceChildren(header, page ? h('div', { class: 'docs-layout' }, nav(page), article(page, shown!)) : index());
  history.replaceState(null, '', location.pathname + location.search + docRoute(page?.slug, section, lang));
  const target = section ? dialog.querySelector(`[id="${CSS.escape(section)}"]`) : null;
  if (target) target.scrollIntoView();
  else dialog.scrollTop = 0;
}

/** Open the documentation at the address in the fragment (#/docs…), if it is one. */
export function showDocsFromHash(): void {
  const route = parseDocRoute(location.hash);
  if (route) showDocs(route.page?.slug, route.section, route.lang);
}
