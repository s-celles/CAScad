import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { expect, test } from './fixtures';

const ROOT = join(import.meta.dirname, '..', '..');
const L = String.raw;

test.describe('KRN-004 KRN-005 boot', () => {
  test('starts without errors, both kernels available', async ({ app }) => {
    const { page } = app;
    await expect(page.locator('#kernel-select option[value="giac-js"]')).toBeEnabled();
    await expect(page.locator('#kernel-select option[value="compute-engine"]')).toBeEnabled();
    expect(await page.evaluate(() => typeof caseval === 'function' && giacReady)).toBe(true);
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
    });
  }
}
