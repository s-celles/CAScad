// The notebook format of docs/en-notebook-format.md: the JSON Schema of the
// version 5 file and the line format of #nb= links, as other applications
// (Progressive Web Office's "Open in CAScad") produce them.

import { describe, expect, it } from 'bun:test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import Ajv2020 from 'ajv/dist/2020.js';
import LZString from 'lz-string';
import { createSandbox, plain, ROOT } from './helpers/sandbox';

const schema = JSON.parse(readFileSync(join(ROOT, 'docs', 'notebook-v5.schema.json'), 'utf8')) as object;
const validate = new Ajv2020({ allErrors: true, strict: true }).compile(schema);
const valid = (data: unknown) => validate(data) || (validate.errors ?? []);

describe('FILE-001 FILE-002 notebook file, format version 5', () => {
  it('has a JSON Schema', () => {
    expect(typeof validate).toBe('function');
  });

  it('accepts the minimal file of the documentation', () => {
    const doc = readFileSync(join(ROOT, 'docs', 'en-notebook-format.md'), 'utf8');
    const sample = JSON.parse(doc.match(/```json\n([\s\S]*?)```/)![1]!);
    expect(valid(sample)).toBe(true);
  });

  it('accepts every kind of cell, with the fields CAScad writes', () => {
    expect(valid({
      version: 5, type: 'cascad-notebook', kernel: 'giac-js', created: '2026-11-28T08:00:00.000Z', locale: 'fr', reactiveMode: true,
      cells: [
        { uid: 'a1b2c3', type: 'math', mode: 'math', latex: 'x^2', mathjson: ['Power', 'x', 2], defines: [], references: [], hidden: false, disabled: false, locked: false },
        { type: 'math', mode: 'raw', content: 'factor(x^4-1)' },
        { type: 'raw', mode: 'raw', content: 'a := 3' },
        { type: 'text', content: '@bind(a, 0, 10, 1, 3)' },
        { type: 'slider', params: [{ name: 'a', label: 'a', min: 0, max: 10, step: 1, value: 3 }], expression: 'a*x', plotType: 'plot' },
      ],
    })).toBe(true);
  });

  it('accepts the sample given to Progressive Web Office (CALC-009)', () => {
    expect(valid({ version: 5, type: 'cascad-notebook', kernel: 'giac-js', cells: [{ type: 'math', latex: '\\frac{d}{dx}\\sin(x)' }, { type: 'raw', content: 'factor(x^4-1)' }] })).toBe(true);
  });

  it('refuses malformed files', () => {
    const cells = [{ type: 'raw', content: 'x' }];
    for (const bad of [
      { version: 4, cells },
      { version: 5 },
      { version: 5, kernel: 'maple', cells },
      { version: 5, cells: [{ type: 'math', content: 'x^2' }] }, // math cell without latex
      { version: 5, cells: [{ type: 'math', mode: 'raw', latex: 'x' }] }, // raw mode without content
      { version: 5, cells: [{ type: 'image', content: 'x' }] },
      { version: 5, cells: [{ type: 'raw', content: 'x', uid: 'a b' }] },
    ]) expect(valid(bad)).not.toBe(true);
  });
});

describe('SHARE #nb= links: lz-string 1.5.0 and one line per cell', () => {
  const { context } = createSandbox(['js/qr-sharing.js']);
  const deserialize = context.deserializeNotebook as (text: string) => unknown;

  it('reads a link built as another application would', () => {
    const text = ['M:\\frac{d}{dx}\\sin(x)', 'X:factor(x^4-1)', 'T:## Notes\\n$e^{i\\pi}+1=0$'].join('\n');
    const data = LZString.compressToEncodedURIComponent(text);
    expect(data).toMatch(/^[A-Za-z0-9+\-$]+$/);
    expect(plain(deserialize(LZString.decompressFromEncodedURIComponent(data)!))).toEqual([
      { type: 'math', content: '\\frac{d}{dx}\\sin(x)' },
      { type: 'raw', content: 'factor(x^4-1)' },
      { type: 'text', content: '## Notes\n$e^{i\\pi}+1=0$' },
    ]);
  });

  it('skips lines of another kind and refuses an empty notebook', () => {
    expect(plain(deserialize('Q:what\nX:1+1'))).toEqual([{ type: 'raw', content: '1+1' }]);
    expect(deserialize('nothing here')).toBeNull();
  });
});
