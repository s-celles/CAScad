/**
 * Markdown to HTML for the bundled documentation (trusted content), with marked,
 * as in QRShare: headings get GitHub-style anchors, links to other docs/ pages
 * stay in the app, other links open in a new tab.
 */
import { Marked } from 'marked';

/** Maps a link target to an in-app address, or returns null to keep it external. */
export type LinkResolver = (href: string) => string | null;

/** GitHub-style heading anchor: "Send to another device" → "send-to-another-device". */
export function headingId(text: string): string {
  return text
    .toLowerCase()
    .replace(/<[^>]*>/g, '')
    .replace(/[^\p{L}\p{N} _-]/gu, '')
    .replace(/ /g, '-');
}

const escapeHtml = (text: string): string => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export function markdownToHtml(md: string, resolveLink: LinkResolver = () => null): string {
  // Repeated headings get "-1", "-2"… as on GitHub, so section links match.
  const seen = new Map<string, number>();
  const marked = new Marked({
    gfm: true,
    renderer: {
      heading({ tokens, depth, text }) {
        let id = headingId(text);
        const count = seen.get(id) ?? 0;
        seen.set(id, count + 1);
        if (count > 0) id = `${id}-${count}`;
        return `<h${depth} id="${escapeHtml(id)}">${this.parser.parseInline(tokens)}</h${depth}>\n`;
      },
      // The docs use no HTML: anything that looks like a tag is shown as text.
      html({ text }) {
        return escapeHtml(text);
      },
      link({ href, title, tokens }) {
        const text = this.parser.parseInline(tokens);
        const titleAttr = title ? ` title="${escapeHtml(title)}"` : '';
        const internal = resolveLink(href);
        if (internal !== null) return `<a href="${escapeHtml(internal)}"${titleAttr}>${text}</a>`;
        return `<a href="${escapeHtml(href)}"${titleAttr} target="_blank" rel="noopener noreferrer">${text}</a>`;
      },
    },
  });
  return marked.parse(md.replace(/^---\n[\s\S]*?\n---\n/, ''), { async: false });
}
