// Integration: LaTeX (math field) → MathJSON (Compute Engine) → Giac syntax →
// the real Giac engines (giac-wasm, and giac.js in a Worker), without a browser.

import { afterAll, beforeAll, describe, expect, it } from 'bun:test';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createSandbox, ROOT } from './helpers/sandbox';
import { computeEngine, startGiac, type Giac } from './helpers/engines';

const ce = computeEngine();
const sb = createSandbox(['js/mathjson-giac.js', 'js/plot-rendering.js'], { ce });
const latexToGiac = sb.fn('latexToGiac');
const mathJsonToGiac = sb.fn('mathJsonToGiac');
const isGiacError = sb.fn('isGiacError');
const parseGiacList = sb.fn('parseGiacList');
const L = String.raw;

const mathFieldToMathJson = sb.fn('mathFieldToMathJson');
const field = (value: string) => ({ value, getValue: () => value });
/** Same route as getGiacExpr() in js/execution.js. */
const toGiac = (latex: string): string => (/\\operatorname/.test(latex) ? latexToGiac(latex) : mathJsonToGiac(mathFieldToMathJson(field(latex))));
const noSpace = (s: string) => s.replace(/\s+/g, '');

// Graphics are drawn by js/plot-rendering.js in the browser (see tests/e2e).
const PLOT_COMMAND = /\b(plot\w*|implicitplot|densityplot|listplot|scatterplot|histogram|barplot|piechart|camembert|polygonplot|vectorfield|fieldplot|boxwhisker|circle|segment|point|line|polygon|triangle|square|droite)\s*\(/;

// Problems of the example notebooks themselves, to fix in the notebooks.
const KNOWN_ISSUES: Record<string, RegExp> = {
  // `x := …` is assigned before `desolve(…, y)`, whose implicit variable is x;
  // it only works in the app because of the reactive evaluation order.
  'physics-mechanics.json': /Independ[ae]nt variable assigned/, // "Independant" before GIAC 2.1.0
};

// The app's engine (giac-wasm) and its fallback (giac.js, asm.js) must agree.
for (const engine of ['giac-wasm', 'giac.js'] as const) describe(engine, () => {
  let giac: Giac;
  beforeAll(async () => { giac = await startGiac(engine); }, 60_000);
  afterAll(() => giac?.terminate());

  describe('KRN-001 MATH-002 math cells evaluated by Giac', () => {
    const cases: [string, string | RegExp][] = [
      [L`\frac{d}{dx}\sin(x)`, 'cos(x)'],
      [L`\int_0^1 x^2\,dx`, /^1\/3/],
      [L`\lim_{x\to 0} \frac{\sin(x)}{x}`, '1'],
      [L`\lim_{x\to 0^+}\frac{1}{x}`, '+infinity'],
      [L`\lim_{x\to 0^-}\frac{1}{x}`, '-infinity'],
      [L`\lim_{x\to 0^+} x\ln(x)`, '0'],
      [L`\sum_{k=1}^{10} k`, '55'],
      [L`\prod_{k=1}^{5} k`, '120'],
      [L`\operatorname{factor}\left(x^4-1\right)`, '(x-1)*(x+1)*(x^2+1)'],
      [L`\operatorname{solve}\left(x^2-5x+6=0,x\right)`, /^(list)?\[2,3\]$/],
      [L`\operatorname{expand}\left(2x(x+1)\right)`, '2*x^2+2*x'],
      [L`\operatorname{factor}\left(\sum_{k=1}^{n} k\right)`, 'n*(n+1)/2'],
      [L`\operatorname{det}\begin{pmatrix}1&2\\3&4\end{pmatrix}`, '-2'],
    ];
    for (const [latex, expected] of cases) {
      it(latex, async () => {
        const expr = toGiac(latex);
        const out = noSpace(await giac.caseval(expr));
        expect(isGiacError(out)).toBeFalsy();
        if (expected instanceof RegExp) expect(out).toMatch(expected);
        else expect(out).toBe(noSpace(expected));
      });
    }
  });

  describe('OUT-002 OUT-003 Giac errors and messages', () => {
    it('an invalid call is reported with the GIAC_ERROR prefix', async () => {
      expect(isGiacError(await giac.caseval('factor('))).toBeTruthy();
    });
    it('a syntax error is printed as a message', async () => {
      const r = await giac.run('1+');
      expect(r.result).toBe('undef');
      expect(r.messages.join('\n')).toContain('syntax error');
    });
    it('latex() gives a quoted LaTeX string (rendering of results)', async () => {
      expect(await giac.caseval('latex(quote(x^2/2))')).toBe('"\\frac{x^{2}}{2}"');
    });
    it('parseGiacList reads lists printed as list[...] (solve results)', async () => {
      expect([...parseGiacList(await giac.caseval('solve(x^2=4,x)'))]).toEqual([-2, 2]);
    });
  });

  describe('KRN-001 every non-graphic cell of the Giac examples evaluates without error', () => {
    const dir = join(ROOT, 'examples', 'giac-js');
    for (const file of readdirSync(dir).filter((f) => f.endsWith('.json'))) {
      it(file, async () => {
        await giac.caseval('restart');
        const nb = JSON.parse(readFileSync(join(dir, file), 'utf8')) as { cells: { type: string; content?: string }[] };
        const failures: string[] = [];
        for (const cell of nb.cells) {
          if (!cell.content || (cell.type !== 'math' && cell.type !== 'raw')) continue;
          const expr = cell.type === 'math' ? toGiac(cell.content) : cell.content;
          if (/^\?|^help\(/.test(expr) || PLOT_COMMAND.test(expr)) continue;
          const r = await giac.run(expr);
          const out = r.error !== undefined ? `throws ${r.error}` : r.result!;
          if (KNOWN_ISSUES[file]?.test(out)) continue;
          if (r.error !== undefined || isGiacError(out) || /invisibleOperator/i.test(expr)) failures.push(`${expr} → ${out.slice(0, 120)}`);
        }
        expect(failures).toEqual([]);
      }, 30_000);
    }
  });
});
