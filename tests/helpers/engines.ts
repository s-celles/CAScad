// Real engines for integration tests: the Compute Engine of package.json
// (same version as the CDN URL of index.html, checked by the tests) and Giac:
// giac-wasm (the app's engine, package.json) or giac.js (asm.js, the fallback)
// running in a Worker.

import { ComputeEngine } from '@cortex-js/compute-engine';
import { createSandbox } from './sandbox';

let ce: ComputeEngine | null = null;
export function computeEngine(): ComputeEngine {
  ce ??= new ComputeEngine();
  return ce;
}

export interface GiacResult { result?: string; error?: string; messages: string[] }

export interface Giac {
  caseval(expr: string): Promise<string>;
  run(expr: string): Promise<GiacResult>;
  terminate(): void;
}

/** The Giac engines of the app: giac-wasm by default, giac.js (asm.js) as the fallback. */
export type GiacEngine = 'giac-wasm' | 'giac.js';

/** Starts the given engine and resolves when it is ready. */
export function startGiac(engine: GiacEngine = 'giac-wasm'): Promise<Giac> {
  return engine === 'giac-wasm' ? startGiacWasm() : startGiacAsmJs();
}

/**
 * giac-wasm, behind the same caseval() adapter as the app (js/giac-engine.js):
 * errors come back as "GIAC_ERROR: …" strings, GIAC's messages apart.
 */
async function startGiacWasm(): Promise<Giac> {
  const { loadGiac } = await import('giac-wasm');
  const session = await loadGiac({ timeout: 30 });
  const messages: string[] = [];
  const caseval = createSandbox(['js/giac-engine.js']).fn('giacWasmCaseval')(session, (_type: string, text: string) => messages.push(text)) as (expr: string) => string;
  const run = async (expr: string): Promise<GiacResult> => {
    messages.length = 0;
    try {
      return { result: caseval(expr), messages: [...messages] };
    } catch (err) {
      return { error: String((err as Error).message ?? err), messages: [...messages] };
    }
  };
  return {
    run,
    caseval: async (expr) => {
      const r = await run(expr);
      if (r.error !== undefined) throw new Error(r.error);
      return r.result!;
    },
    terminate: () => {},
  };
}

/** giac.js (asm.js) in a Worker, with the Module and UI objects it expects. */
function startGiacAsmJs(): Promise<Giac> {
  const worker = new Worker(new URL('./giac-worker.ts', import.meta.url).href);
  const calls = new Map<number, (r: GiacResult) => void>();
  let next = 0;
  return new Promise((resolve, reject) => {
    worker.onerror = (e) => reject(e);
    worker.onmessage = (event: MessageEvent<{ ready?: boolean; id?: number } & GiacResult>) => {
      const data = event.data;
      if (data.ready) {
        const run = (expr: string) => new Promise<GiacResult>((done) => {
          const id = next++;
          calls.set(id, done);
          worker.postMessage({ id, expr });
        });
        resolve({
          run,
          caseval: async (expr) => {
            const r = await run(expr);
            if (r.error !== undefined) throw new Error(r.error);
            return r.result!;
          },
          terminate: () => worker.terminate(),
        });
        return;
      }
      calls.get(data.id!)?.(data);
      calls.delete(data.id!);
    };
  });
}
