import { describe, expect, it } from 'bun:test';
import requirements from '../docs/requirements.md' with { type: 'text' };

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

