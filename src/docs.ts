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

export type DocGroup = 'using' | 'developing';

export interface DocPage {
  slug: string;
  group: DocGroup;
  /** Markdown file name in docs/. */
  file: string;
  content: string;
}

export const DOC_GROUPS: DocGroup[] = ['using', 'developing'];

export const DOC_PAGES: readonly DocPage[] = [
  { slug: 'user-guide', group: 'using', file: 'en-user-guide.md', content: userGuide },
  { slug: 'sharing', group: 'using', file: 'en-sharing.md', content: sharing },
  { slug: 'architecture', group: 'developing', file: 'en-architecture.md', content: architecture },
  { slug: 'development', group: 'developing', file: 'en-development.md', content: development },
  { slug: 'requirements', group: 'developing', file: 'requirements.md', content: requirements },
];

export const DOCS_SOURCE_URL = 'https://github.com/s-celles/CAScad/blob/main/docs';

export function findDocPage(slug: string | null | undefined): DocPage | undefined {
  return DOC_PAGES.find((page) => page.slug === slug);
}

/** The page a docs/ file name belongs to, e.g. "en-sharing.md". */
export function findDocByFile(file: string): DocPage | undefined {
  const name = file.split('/').pop() ?? file;
  return DOC_PAGES.find((page) => page.file === name);
}

/** The in-app address of the index, of a page, or of one of its sections (heading anchor). */
export function docRoute(slug?: string, section?: string): string {
  if (!slug) return '#/docs';
  return `#/docs?page=${slug}${section ? `&section=${encodeURIComponent(section)}` : ''}`;
}

/** The page and section asked for by an address fragment, or null when it is not a docs address. */
export function parseDocRoute(hash: string): { page?: DocPage; section?: string } | null {
  if (hash !== '#/docs' && !hash.startsWith('#/docs?')) return null;
  const params = new URLSearchParams(hash.slice('#/docs'.length).replace(/^\?/, ''));
  return { page: findDocPage(params.get('page')), section: params.get('section') ?? undefined };
}

/** Links to a docs/ file or to a section of the current page stay in the app; anything else is external. */
export function docLinkResolver(current: DocPage): (href: string) => string | null {
  return (href) => {
    if (/^[a-z][a-z0-9+.-]*:/i.test(href) || href.startsWith('//')) return null;
    const [file, section] = href.split('#', 2);
    const page = file ? findDocByFile(file) : current;
    return page ? docRoute(page.slug, section) : null;
  };
}
