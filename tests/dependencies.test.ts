import { describe, expect, it } from 'bun:test';
import { join } from 'path';
import { cdnDependencies, collectDependencies } from '../scripts/dependencies';

const ROOT = join(import.meta.dir, '..');

describe('PLT-008 pinned dependencies', () => {
  it('pins every library loaded from a CDN to an exact version', () => {
    const unpinned = cdnDependencies(ROOT).filter((d) => !/^\d+\.\d+\.\d+$/.test(d.version));
    expect(unpinned).toEqual([]);
  });

  it('pins every bundled dependency to an exact version in package.json', async () => {
    const pkg = (await Bun.file(join(ROOT, 'package.json')).json()) as { dependencies?: Record<string, string>; devDependencies?: Record<string, string> };
    for (const version of Object.values({ ...pkg.dependencies, ...pkg.devDependencies })) expect(version).toMatch(/^\d+\.\d+\.\d+$/);
  });

  it('finds the libraries of the app (UI-005)', () => {
    const names = collectDependencies(ROOT).map((d) => d.name);
    for (const name of ['mathlive', '@cortex-js/compute-engine', 'katex', 'jsxgraph', 'lit', 'mermaid', 'lean-qr', 'marked']) expect(names).toContain(name);
  });
});
