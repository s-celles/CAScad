import { describe, expect, it } from 'bun:test';
import { readdirSync } from 'fs';
import { DOC_PAGES, docLanguage, docLinkResolver, docRoute, findDocPage, parseDocRoute, type DocLang } from '../src/docs';
import { headingId, markdownToHtml } from '../src/markdown';

const page = (slug: string) => findDocPage(slug)!;

describe('UI-006 in-app documentation', () => {
  it('lists every Markdown file of docs/ exactly once', () => {
    const files = readdirSync(new URL('../docs/', import.meta.url)).filter((f) => f.endsWith('.md'));
    expect(DOC_PAGES.flatMap((p) => Object.values(p.files)).sort()).toEqual(files.sort());
    expect(new Set(DOC_PAGES.map((p) => p.slug)).size).toBe(DOC_PAGES.length);
  });

  it('starts each page with a title', () => {
    for (const p of DOC_PAGES) for (const text of Object.values(p.content)) expect(text.replace(/^---\n[\s\S]*?\n---\n/, '').trimStart()).toMatch(/^# /);
  });

  it('builds and parses in-app addresses', () => {
    expect(docRoute()).toBe('#/docs');
    expect(docRoute('sharing', 'link-containing-the-notebook')).toBe('#/docs?page=sharing&section=link-containing-the-notebook');
    expect(parseDocRoute('#/docs?page=sharing&section=receive')).toEqual({ page: page('sharing'), section: 'receive', lang: undefined });
    expect(parseDocRoute('#/docs?page=sharing&lang=fr')).toEqual({ page: page('sharing'), section: undefined, lang: 'fr' });
    expect(parseDocRoute('#/docs')).toEqual({ page: undefined, section: undefined, lang: undefined });
    expect(parseDocRoute('#nb=abc')).toBeNull();
    expect(parseDocRoute('#/docsx')).toBeNull();
  });

  it('keeps links between pages in the app and opens other links in a new tab', () => {
    const resolve = docLinkResolver(page('user-guide'));
    expect(resolve('en-sharing.md')).toBe('#/docs?page=sharing');
    expect(resolve('en-sharing.md#receive')).toBe('#/docs?page=sharing&section=receive');
    expect(resolve('#running-cells')).toBe('#/docs?page=user-guide&section=running-cells');
    expect(resolve('https://example.org/')).toBeNull();
    const html = markdownToHtml('[a](en-sharing.md) [b](https://example.org/)', resolve);
    expect(html).toContain('<a href="#/docs?page=sharing">a</a>');
    expect(html).toContain('<a href="https://example.org/" target="_blank" rel="noopener noreferrer">b</a>');
  });

  it('resolves every link between pages, in every language, to an existing page and section', () => {
    for (const p of DOC_PAGES) {
      for (const [lang, text] of Object.entries(p.content) as [DocLang, string][]) {
        const html = markdownToHtml(text, docLinkResolver(p, lang));
        for (const [, href] of html.matchAll(/<a href="(#\/docs[^"]*)"/g)) {
          const route = parseDocRoute(href!.replace(/&amp;/g, '&'))!;
          expect(route.page).toBeDefined();
          const target = route.page!.content[docLanguage(route.page!, route.lang ?? 'en')]!;
          if (route.section) expect(markdownToHtml(target)).toContain(`id="${route.section}"`);
        }
      }
    }
  });

  it('shows a page in the interface language when it is written in it, in English otherwise', () => {
    expect(docLanguage(page('user-guide'), 'fr')).toBe('fr');
    expect(docLanguage(page('user-guide'), 'de')).toBe('en');
    expect(docLanguage(page('architecture'), 'fr')).toBe('en');
    // A French page links to the French version of another page
    expect(docLinkResolver(page('user-guide'), 'fr')('fr-partage.md')).toBe('#/docs?page=sharing&lang=fr');
    expect(docLinkResolver(page('user-guide'), 'fr')('#fichiers')).toBe('#/docs?page=user-guide&section=fichiers&lang=fr');
  });

  it('gives headings GitHub-style anchors and escapes raw HTML', () => {
    expect(headingId('Send to another device with QRShare')).toBe('send-to-another-device-with-qrshare');
    expect(headingId('Phone to computer (P2P)')).toBe('phone-to-computer-p2p');
    const html = markdownToHtml('---\ndescription: x\n---\n\n# Title\n\n<script>alert(1)</script>');
    expect(html).not.toContain('description');
    expect(html).toContain('<h1 id="title">Title</h1>');
    expect(html).not.toContain('<script>');
  });
});
