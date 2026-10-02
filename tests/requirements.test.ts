import { describe, expect, it } from 'bun:test';
import requirements from '../docs/requirements.md' with { type: 'text' };
import { requirementsHtml } from '../src/requirements';

/** Table rows of the specification: ID, priority, status, requirement. */
const rows = [...requirements.matchAll(/^\| ([A-Z0-9]+-\d{3}) \| (\w) \| (\S+) \| (.+) \|$/gm)].map((m) => ({ id: m[1]!, pri: m[2]!, status: m[3]!, text: m[4]! }));

describe('requirements specification', () => {
  it('has requirements with unique, well-formed IDs', () => {
    expect(rows.length).toBeGreaterThan(50);
    expect(new Set(rows.map((r) => r.id)).size).toBe(rows.length);
  });

  it('gives each requirement a MoSCoW priority and a status', () => {
    for (const r of rows) {
      expect(['M', 'S', 'C', 'W']).toContain(r.pri);
      expect(['✅', '🚧', '📋']).toContain(r.status);
    }
  });

  it('writes each requirement with an EARS template', () => {
    for (const r of rows) expect(r.text).toMatch(/\b(shall|should)\b/);
  });

  it('numbers the requirements of each area in sequence', () => {
    const byArea = new Map<string, number[]>();
    for (const r of rows) {
      const [area, n] = r.id.split('-') as [string, string];
      byArea.set(area, [...(byArea.get(area) ?? []), Number(n)]);
    }
    for (const numbers of byArea.values()) expect(numbers).toEqual(numbers.map((_, i) => i + 1));
  });
});

describe('UI-006 requirements viewer', () => {
  it('renders the specification without its front matter, links opening in a new tab', () => {
    const html = requirementsHtml('---\ndescription: x\n---\n\n# Title\n\n| ID | Pri |\n|---|---|\n| A-001 | M |\n\nSee [EARS](https://example.org/).');
    expect(html).not.toContain('description');
    expect(html).toContain('<h1>Title</h1>');
    expect(html).toContain('<td>A-001</td>');
    expect(html).toContain('<a href="https://example.org/" target="_blank" rel="noopener"');
  });

  it('renders the real specification', () => {
    expect(requirementsHtml()).toContain('<table>');
  });
});
