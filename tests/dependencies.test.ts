import { describe, expect, it } from 'bun:test';
import { readFileSync } from 'fs';
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
    // An exact version, or the asset of a GitHub release of an exact version
    // (giac-wasm), whose integrity bun.lock records.
    const exact = /^(\d+\.\d+\.\d+|https:\/\/github\.com\/[\w.-]+\/[\w.-]+\/releases\/download\/[\w.-]+\/[\w.-]+-\d+\.\d+\.\d+\.tgz)$/;
    for (const version of Object.values({ ...pkg.dependencies, ...pkg.devDependencies })) expect(version).toMatch(exact);
  });

  it('locks the giac-wasm release by its integrity hash', () => {
    const lock = readFileSync(join(ROOT, 'bun.lock'), 'utf8');
    expect(lock).toMatch(/"giac-wasm": \["giac-wasm@https:\/\/github\.com\/JuliaGiac\/giac\/releases\/download\/giac-wasm-v[\d.]+\/giac-wasm-[\d.]+\.tgz", \{\}, "sha512-/);
  });

  it('finds the libraries of the app (UI-005)', () => {
    const names = collectDependencies(ROOT).map((d) => d.name);
    for (const name of ['mathlive', '@cortex-js/compute-engine', 'katex', 'jsxgraph', 'lit', 'mermaid', 'lean-qr', 'marked', 'giac-wasm']) expect(names).toContain(name);
  });
});
