// Real engines for integration tests: the Compute Engine of package.json
// (same version as the CDN URL of index.html, checked by the tests) and Giac
// (giac.js) running in a Worker.

import { ComputeEngine } from '@cortex-js/compute-engine';

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

/** Starts Giac in a Worker and resolves when it is ready (a few seconds). */
export function startGiac(): Promise<Giac> {
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
