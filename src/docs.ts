/**
 * The documentation pages of docs/, bundled into the app and shown under
 * #/docs (as in QRShare). To add a page: create the Markdown file in docs/,
 * import it here and list it in DOC_PAGES, with "docsPage_<slug>" and
 * "docsDesc_<slug>" translations.
 */
import userGuide from '../docs/en-user-guide.md' with { type: 'text' };
import sharing from '../docs/en-sharing.md' with { type: 'text' };
import architecture from '../docs/en-architecture.md' with { type: 'text' };
import development from '../docs/en-development.md' with { type: 'text' };
import requirements from '../docs/requirements.md' with { type: 'text' };
import userGuideFr from '../docs/fr-guide-utilisateur.md' with { type: 'text' };
import sharingFr from '../docs/fr-partage.md' with { type: 'text' };

export type DocGroup = 'using' | 'developing';

/** Languages the documentation is written in; English always exists. */
export type DocLang = 'en' | 'fr';

export interface DocPage {
  slug: string;
  group: DocGroup;
  /** Markdown file name in docs/, per language. */
  files: { en: string } & Partial<Record<DocLang, string>>;
  content: { en: string } & Partial<Record<DocLang, string>>;
}

export const DOC_GROUPS: DocGroup[] = ['using', 'developing'];

export const DOC_PAGES: readonly DocPage[] = [
  {
    slug: 'user-guide',
    group: 'using',
    files: { en: 'en-user-guide.md', fr: 'fr-guide-utilisateur.md' },
    content: { en: userGuide, fr: userGuideFr },
  },
  {
    slug: 'sharing',
    group: 'using',
    files: { en: 'en-sharing.md', fr: 'fr-partage.md' },
    content: { en: sharing, fr: sharingFr },
  },
  { slug: 'architecture', group: 'developing', files: { en: 'en-architecture.md' }, content: { en: architecture } },
  { slug: 'development', group: 'developing', files: { en: 'en-development.md' }, content: { en: development } },
  { slug: 'requirements', group: 'developing', files: { en: 'requirements.md' }, content: { en: requirements } },
];

export const DOCS_SOURCE_URL = 'https://github.com/s-celles/CAScad/blob/main/docs';

export function findDocPage(slug: string | null | undefined): DocPage | undefined {
  return DOC_PAGES.find((page) => page.slug === slug);
}

/** The page a docs/ file name (in any language) belongs to, e.g. "fr-partage.md". */
export function findDocByFile(file: string): DocPage | undefined {
  const name = file.split('/').pop() ?? file;
  return DOC_PAGES.find((page) => Object.values(page.files).includes(name));
}

/** The language a page is shown in for `lang` (an interface language): its own if written, else English. */
export function docLanguage(page: DocPage, lang: string): DocLang {
  const short = lang.slice(0, 2) as DocLang;
  return page.content[short] !== undefined ? short : 'en';
}

/** The in-app address of the index, of a page, or of one of its sections (heading anchor). */
export function docRoute(slug?: string, section?: string, lang?: string): string {
  if (!slug) return '#/docs';
  return `#/docs?page=${slug}${section ? `&section=${encodeURIComponent(section)}` : ''}${lang ? `&lang=${lang}` : ''}`;
}

/** What an address fragment asks for (page, section, language), or null when it is not a docs address. */
export function parseDocRoute(hash: string): { page?: DocPage; section?: string; lang?: string } | null {
  if (hash !== '#/docs' && !hash.startsWith('#/docs?')) return null;
  const params = new URLSearchParams(hash.slice('#/docs'.length).replace(/^\?/, ''));
  return { page: findDocPage(params.get('page')), section: params.get('section') ?? undefined, lang: params.get('lang') ?? undefined };
}

/**
 * Links to a docs/ file or to a section of the current page stay in the app,
 * in the language of the page they point to; anything else is external.
 */
export function docLinkResolver(current: DocPage, lang?: DocLang): (href: string) => string | null {
  return (href) => {
    if (/^[a-z][a-z0-9+.-]*:/i.test(href) || href.startsWith('//')) return null;
    const [file, section] = href.split('#', 2);
    const page = file ? findDocByFile(file) : current;
    if (!page) return null;
    const fileLang = file ? (Object.entries(page.files).find(([, name]) => name === file.split('/').pop())?.[0] as DocLang | undefined) : lang;
    return docRoute(page.slug, section, fileLang && fileLang !== 'en' ? fileLang : undefined);
  };
}
