// Loads plain scripts of js/ (classic browser scripts sharing globals) into an
// isolated node:vm context, so unit tests can call their functions.
// Top-level `function`/`var` declarations become properties of the context;
// top-level `const`/`let` are read with `get()`.

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import vm from 'node:vm';

export const ROOT = join(import.meta.dir, '..', '..');

// Functions of the loaded scripts are untyped plain JavaScript.
export type ScriptFn = (...args: any[]) => any;

export interface Sandbox {
  context: vm.Context;
  load(path: string): Sandbox;
  get<T = unknown>(name: string): T;
  fn(name: string): ScriptFn;
}

export function createSandbox(scripts: string[], globals: Record<string, unknown> = {}): Sandbox {
  const context = vm.createContext({ console, setTimeout, clearTimeout, TextEncoder, TextDecoder, atob, btoa, crypto, ...globals });
  context.window = context;
  const sandbox: Sandbox = {
    context,
    load(path) {
      const file = join(ROOT, path);
      vm.runInContext(readFileSync(file, 'utf8'), context, { filename: file });
      return sandbox;
    },
    get: <T>(name: string) => vm.runInContext(name, context) as T,
    fn: (name) => vm.runInContext(name, context) as ScriptFn,
  };
  for (const s of scripts) sandbox.load(s);
  return sandbox;
}

/** JSON copy, so values from the vm realm compare with toEqual. */
export const plain = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;
