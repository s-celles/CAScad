import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import Ajv2020 from 'ajv/dist/2020.js';
import { expect, test } from './fixtures';

const ROOT = join(import.meta.dirname, '..', '..');
// The JSON Schema of the exported file (docs/en-notebook-format.md)
const validateNotebook = new Ajv2020({ allErrors: true }).compile(JSON.parse(readFileSync(join(ROOT, 'docs', 'notebook-v5.schema.json'), 'utf8')));
const L = String.raw;

test.describe('KRN-004 KRN-005 boot', () => {
  test('starts without errors, both kernels available', async ({ app }) => {
    const { page } = app;
    await expect(page.locator('#kernel-select option[value="giac-js"]')).toBeEnabled();
    await expect(page.locator('#kernel-select option[value="compute-engine"]')).toBeEnabled();
    expect(await page.evaluate(() => typeof caseval === 'function' && giacReady)).toBe(true);
  });

  test('KRN-001 computes with giac-wasm (GIAC 2.1.0)', async ({ app }) => {
    expect(await app.page.evaluate(() => ({ engine: window.giacEngine?.engine, version: window.giacEngine?.version }))).toEqual({ engine: 'giac-wasm', version: '2.1.0' });
    expect(await app.page.evaluate(() => (caseval as (e: string) => string)('int(x^2,x,0,1)'))).toBe('1/3');
  });

  test('KRN-001 falls back to giac.js (asm.js) with ?giac=asm', async ({ app }) => {
    const { page } = app;
    await page.goto('/index.html?giac=asm');
    await expect(page.locator('#giac-status')).toHaveClass(/ready/, { timeout: 90_000 });
    expect(await page.evaluate(() => window.giacEngine?.engine)).toBe('giac.js');
    expect((await app.rawCell('factor(x^4-1)')).replace(/\s/g, '')).toContain('x2+1');
  });
});

test.describe('PLT-008 pinned CDN libraries load', () => {
  test('at start-up', async ({ app }) => {
    const { page } = app;
    await page.evaluate(() => Promise.all([window._mermaidReady, window._litReady, window._observableReady]));
    expect(await page.evaluate(() => ({
      jsxgraph: typeof JXG !== 'undefined',
      mermaid: typeof window.mermaid?.render === 'function',
      observable: observableAvailable(),
      lit: !!customElements.get('slider-param'),
    }))).toEqual({ jsxgraph: true, mermaid: true, observable: true, lit: true });
  });

  test('on demand (sharing, QR codes, fountain codes)', async ({ app }) => {
    expect(await app.page.evaluate(async () => {
      const [lz, qr, jsqr, lt] = await Promise.all([_loadLZString(), _loadQRCode(), _loadJsQR(), _loadLT()]);
      return { lz: typeof lz.compressToEncodedURIComponent === 'function', qr: !!qr, jsqr: !!jsqr, lt: !!lt };
    })).toEqual({ lz: true, qr: true, jsqr: true, lt: true });
  });

  test('SHARE: compress → decompress round trip', async ({ app }) => {
    await app.addCell('math', { latex: L`\frac{1}{x}` });
    expect(await app.page.evaluate(async () => {
      const text = await decompressNotebook(await compressNotebook());
      return typeof text === 'string' && text.length > 0;
    })).toBe(true);
  });
});

test.describe('MATH-002 OUT-001 Giac kernel — math (visual) cells', () => {
  test('derivative', async ({ app }) => {
    expect(await app.mathCell(L`\frac{d}{dx}\sin(x)`)).toContain('cos');
  });

  test('derivative typed with the "dx" shortcut (\\differentialD)', async ({ app }) => {
    expect(await app.mathCell(L`\frac{\differentialD}{\differentialD x}\sin(x)`)).toContain('cos');
  });

  test('function call f(2)', async ({ app }) => {
    await app.rawCell('f(x):=x^2+1');
    expect(await app.mathCell(L`f(2)`)).toContain('5');
  });

  test('one-sided limits keep their direction', async ({ app }) => {
    expect(await app.mathCell(L`\lim_{x\to 0^+}\frac{1}{x}`)).toMatch(/\+\s*∞/);
    expect(await app.mathCell(L`\lim_{x\to 0^-}\frac{1}{x}`)).toMatch(/[−-]\s*∞/);
  });

  test('CAS function call through \\operatorname', async ({ app }) => {
    expect((await app.mathCell(L`\operatorname{factor}\left(x^4-1\right)`)).replace(/\s/g, '')).toContain('x2+1');
  });

  test('implicit multiplication inside a CAS call', async ({ app }) => {
    expect(await app.mathCell(L`\operatorname{expand}\left(2x(x+1)\right)`)).not.toContain('invisibleOperator');
  });
});

test.describe('OUT-002 OUT-003 Giac kernel — raw cells', () => {
  test('factor', async ({ app }) => {
    expect((await app.rawCell('factor(x^4-1)')).replace(/\s/g, '')).toContain('x2+1');
  });

  test('Giac errors are shown as errors', async ({ app }) => {
    await app.rawCell('factor(');
    await expect(app.page.locator('.cell-error, .err').first()).toBeVisible();
  });

  test('Giac syntax warnings are shown with the result', async ({ app }) => {
    expect(await app.rawCell('1+')).toContain('syntax error');
  });
});

test.describe('FILE export → import', () => {
  test('keeps math cells', async ({ app }) => {
    const { page } = app;
    await app.addCell('math', { latex: L`\frac{x^2-1}{x-1}` });
    const data = await page.evaluate(() => buildNotebookData());
    expect(data.cells.filter((c) => c.type === 'math').at(-1)?.mathjson).toBeTruthy();
    await page.evaluate((d) => loadNotebookData(d), data);
    const latex = await page.evaluate(() => [...document.querySelectorAll('math-field')].map((m) => (m as HTMLElement & { value: string }).value));
    expect(latex.some((l) => l.includes('\\frac'))).toBe(true);
  });
});

test.describe('FILE-001 FILE-002 FILE-005 math cell switched to Giac syntax', () => {
  /** Adds a math cell switched to raw mode and returns its id. */
  async function rawModeMathCell(app: { page: import('@playwright/test').Page; addCell: (t: string, o?: { latex?: string }) => Promise<string> }) {
    const id = await app.addCell('math', { latex: 'x^2' });
    await app.page.evaluate((id) => {
      setCellMode(id, 'raw');
      const ta = document.querySelector<HTMLTextAreaElement>(`#${id} textarea`)!;
      ta.value = 'factor(x^4-1)';
      ta.dispatchEvent(new Event('input', { bubbles: true }));
    }, id);
    return id;
  }
  const lastCell = (page: import('@playwright/test').Page) => page.evaluate(() => {
    const all = document.querySelectorAll<HTMLElement>('.cell');
    const el = all[all.length - 1]!;
    return { type: el.dataset.type, mode: el.dataset.mode, math: el.querySelector('math-field') !== null, text: el.querySelector('textarea')?.value };
  });

  test('stays a Giac-syntax cell after export → import', async ({ app }) => {
    const { page } = app;
    await rawModeMathCell(app);
    const data = await page.evaluate(() => buildNotebookData());
    expect(data.cells.at(-1)).toMatchObject({ type: 'math', mode: 'raw', content: 'factor(x^4-1)' });
    expect(validateNotebook(data) || validateNotebook.errors).toBe(true);
    await page.evaluate((d) => loadNotebookData(d, { confirmed: true }), data);
    expect(await lastCell(page)).toEqual({ type: 'math', mode: 'raw', math: false, text: 'factor(x^4-1)' });
  });

  test('travels as a Giac cell in a #nb= link (SHARE)', async ({ app }) => {
    const { page } = app;
    await rawModeMathCell(app);
    const lines = await page.evaluate(async () => (await decompressNotebook(await compressNotebook()))!.split('\n'));
    expect(lines.at(-1)).toBe('X:factor(x^4-1)');
  });

  test('stays a Giac-syntax cell after a reload (saved notebook)', async ({ app }) => {
    const { page } = app;
    await rawModeMathCell(app);
    await page.waitForTimeout(1500); // saved shortly after each change
    await page.reload();
    await expect(page.locator('#giac-status')).toHaveClass(/ready/, { timeout: 90_000 });
    expect(await lastCell(page)).toEqual({ type: 'math', mode: 'raw', math: false, text: 'factor(x^4-1)' });
  });
});

test.describe('KRN-002 Compute Engine kernel', () => {
  test('raw cell Factor', async ({ app }) => {
    await app.page.evaluate(() => KernelRegistry.setActive('compute-engine', { silent: true }));
    expect((await app.rawCell('Factor(x^4-1)')).replace(/\s/g, '')).toContain('x2+1');
  });
});

// Every bundled example loads and runs without uncaught errors or cell errors.
for (const kernel of ['giac-js', 'compute-engine']) {
  for (const file of readdirSync(join(ROOT, 'examples', kernel)).filter((f) => f.endsWith('.json'))) {
    test(`EXE-003 example ${kernel}/${file} runs`, async ({ app }) => {
      const { page } = app;
      await page.evaluate(async ([kernel, file]) => {
        const data = await (await fetch(`examples/${kernel}/${file}`)).json();
        for (const c of data.cells) if (c.i18n) { c.content = t(c.i18n) + (c.suffix || ''); delete c.i18n; }
        loadNotebookData(data);
        runAll();
      }, [kernel, file] as const);
      await expect(page.locator('.cell.running')).toHaveCount(0, { timeout: 90_000 });
      await page.waitForTimeout(500);
      const errors = await page.evaluate(() =>
        [...document.querySelectorAll('.cell')]
          .filter((c) => c.classList.contains('cell-error') || c.querySelector('.cell-output .err'))
          .map((c) => `${c.id}: ${((c.querySelector('math-field') as HTMLElement & { value?: string } | null)?.value || c.querySelector('textarea')?.value || '').slice(0, 80)} → ${(c.querySelector('.cell-output') as HTMLElement | null)?.innerText.slice(0, 120)}`));
      expect(errors, 'cells in error').toEqual([]);
      // FILE-001: the export of the example follows the JSON Schema
      const exported = await page.evaluate(() => buildNotebookData());
      expect(validateNotebook(exported) || validateNotebook.errors, 'exported file vs docs/notebook-v5.schema.json').toBe(true);
    });
  }
}
