// Worker that runs the real Giac engine (giac.js, asm.js) for integration
// tests. It has its own global scope, so the Module/UI globals Giac needs do
// not leak into other test files. Messages: { id, expr } → { id, result }.

import { readFileSync } from 'node:fs';
import { join } from 'node:path';

declare const self: Worker & Record<string, unknown>;

const ROOT = join(import.meta.dir, '..', '..');
const scope = globalThis as unknown as Record<string, unknown>;
const messages: string[] = [];

scope.window = scope;
// Same stubs as index.html
scope.UI = {
  Datestart: Date.now(), disable3d: 0, warnpy: false, python_output: '',
  assistant_matr_maxrows: 100, assistant_matr_maxcols: 100,
  clean_for_html: (s: string) => s, add_python_output: () => {},
  set_config_width: () => {}, open_sheet: () => {}, sheet_recompute: () => {}, sheet_set_ij: () => {},
};

let caseval: ((expr: string) => string) | null = null;
const pending: { id: number; expr: string }[] = [];

function answer({ id, expr }: { id: number; expr: string }): void {
  messages.length = 0;
  try {
    self.postMessage({ id, result: caseval!(expr), messages: [...messages] });
  } catch (err) {
    self.postMessage({ id, error: String((err as Error).message ?? err), messages: [...messages] });
  }
}

// Installed before Giac starts, so no request is lost.
self.onmessage = (event: MessageEvent<{ id: number; expr: string }>) => {
  if (caseval) answer(event.data);
  else pending.push(event.data);
};

const Module: Record<string, unknown> = {
  canvas: null, preRun: [], postRun: [],
  print: (t: string) => messages.push(t),
  printErr: (t: string) => messages.push(t),
  setStatus: () => {}, monitorRunDependencies: () => {},
  onRuntimeInitialized: () => {
    const cwrap = Module.cwrap as (name: string, ret: string, args: string[]) => (expr: string) => string;
    caseval = cwrap('caseval', 'string', ['string']);
    self.postMessage({ ready: true });
    for (const request of pending.splice(0)) answer(request);
  },
};
scope.Module = Module;

// giac.js is a classic script that expects the globals above.
(0, eval)(readFileSync(join(ROOT, 'giac.js'), 'utf8'));
