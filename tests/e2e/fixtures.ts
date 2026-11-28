import { test as base, expect, type Page } from '@playwright/test';

/* Globals of the plain scripts of js/, called from page.evaluate(). */
declare global {
  function addCell(type: string, latex?: string, raw?: string): string;
  function runSingleCell(id: string, forceManual?: boolean): void;
  function setCellMode(id: string, mode: 'math' | 'raw'): void;
  function buildNotebookData(): { cells: { type: string; mathjson?: unknown; latex?: string }[] };
  function loadNotebookData(data: unknown, opts?: { keepReactiveMode?: boolean; confirmed?: boolean }): void;
  function runAll(): void;
  function t(key: string): string;
  function observableAvailable(): boolean;
  function compressNotebook(): Promise<string>;
  function decompressNotebook(data: string): Promise<string | null>;
  function _loadLZString(): Promise<{ compressToEncodedURIComponent: unknown }>;
  function _loadQRCode(): Promise<unknown>;
  function _loadJsQR(): Promise<unknown>;
  function _loadLT(): Promise<unknown>;
  var KernelRegistry: { setActive(id: string, opts?: { silent?: boolean }): boolean };
  var giacReady: boolean;
  var JXG: unknown;
  interface Window {
    giacEngine?: { engine: 'giac-wasm' | 'giac.js'; version: string | null };
    mermaid?: { render: unknown };
    _mermaidReady: Promise<void>;
    _litReady: Promise<void>;
    _observableReady: Promise<void>;
  }
}

export interface App {
  page: Page;
  pageErrors: string[];
  addCell(type: string, opts?: { latex?: string; raw?: string }): Promise<string>;
  run(cellId: string): Promise<string>;
  mathCell(latex: string): Promise<string>;
  rawCell(raw: string): Promise<string>;
}

/**
 * `app` fixture: opens CAScad, waits for the Giac kernel (KRN-005) and fails
 * the test on any uncaught page error.
 */
export const test = base.extend<{ app: App }>({
  app: async ({ page }, use) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (err) => pageErrors.push(err.message));
    await page.goto('/index.html');
    await expect(page.locator('#giac-status')).toHaveClass(/ready/, { timeout: 90_000 });

    const app: App = {
      page,
      pageErrors,
      addCell: (type, { latex = '', raw = '' } = {}) =>
        page.evaluate(([type, latex, raw]) => addCell(type, latex, raw), [type, latex, raw] as const),
      async run(cellId) {
        await page.evaluate((id) => runSingleCell(id, true), cellId);
        const out = page.locator(`#${cellId}-output`);
        await expect(out).not.toHaveText(/^\s*$/);
        await expect(out.locator('.spinner')).toHaveCount(0);
        return (await out.innerText()).trim();
      },
      mathCell: async (latex) => app.run(await app.addCell('math', { latex })),
      async rawCell(raw) {
        const id = await app.addCell('math');
        await page.evaluate(([id, raw]) => {
          setCellMode(id, 'raw');
          document.querySelector<HTMLTextAreaElement>(`#${id} textarea`)!.value = raw;
        }, [id, raw] as const);
        return app.run(id);
      },
    };
    await use(app);
    expect(pageErrors, 'uncaught page errors').toEqual([]);
  },
});

export { expect };
