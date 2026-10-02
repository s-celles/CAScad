import { describe, expect, it } from 'bun:test';
import { readdirSync } from 'fs';
import { DOC_PAGES, docLinkResolver, docRoute, findDocPage, parseDocRoute } from '../src/docs';
import { headingId, markdownToHtml } from '../src/markdown';

const page = (slug: string) => findDocPage(slug)!;

describe('UI-006 in-app documentation', () => {
  it('lists every Markdown file of docs/ exactly once', () => {
    const files = readdirSync(new URL('../docs/', import.meta.url)).filter((f) => f.endsWith('.md'));
    expect(DOC_PAGES.map((p) => p.file).sort()).toEqual(files.sort());
    expect(new Set(DOC_PAGES.map((p) => p.slug)).size).toBe(DOC_PAGES.length);
  });

  it('starts each page with a title', () => {
    for (const p of DOC_PAGES) expect(p.content.replace(/^---\n[\s\S]*?\n---\n/, '').trimStart()).toMatch(/^# /);
  });

  it('builds and parses in-app addresses', () => {
    expect(docRoute()).toBe('#/docs');
    expect(docRoute('sharing', 'link-containing-the-notebook')).toBe('#/docs?page=sharing&section=link-containing-the-notebook');
    expect(parseDocRoute('#/docs?page=sharing&section=receive')).toEqual({ page: page('sharing'), section: 'receive' });
    expect(parseDocRoute('#/docs')).toEqual({ page: undefined, section: undefined });
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

  it('resolves every link between pages to an existing page and section', () => {
    for (const p of DOC_PAGES) {
      const html = markdownToHtml(p.content, docLinkResolver(p));
      for (const [, href] of html.matchAll(/<a href="(#\/docs[^"]*)"/g)) {
        const route = parseDocRoute(href!.replace(/&amp;/g, '&'))!;
        expect(route.page).toBeDefined();
        if (route.section) expect(markdownToHtml(route.page!.content)).toContain(`id="${route.section}"`);
      }
    }
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
