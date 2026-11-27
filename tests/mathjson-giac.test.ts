import { describe, expect, it, test } from 'bun:test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createSandbox, plain, ROOT } from './helpers/sandbox';
import { computeEngine } from './helpers/engines';

const ce = computeEngine();
const sb = createSandbox(['js/mathjson-giac.js'], { ce });
const latexToGiac = sb.fn('latexToGiac');
const mathJsonToGiac = sb.fn('mathJsonToGiac');
const L = String.raw;

const mathFieldToMathJson = sb.fn('mathFieldToMathJson');
/** A math field as seen by js/mathjson-giac.js. */
const field = (value: string) => ({ value, getValue: () => value });
/** Same route as getGiacExpr() in js/execution.js: \operatorname → latexToGiac, else the field's MathJSON. */
const toGiac = (latex: string): string => (/\\operatorname/.test(latex) ? latexToGiac(latex) : mathJsonToGiac(mathFieldToMathJson(field(latex))));

describe('MATH-002 visual input → MathJSON → Giac syntax', () => {
  const cases: [string, string][] = [
    // arithmetic, implicit multiplication
    [L`x^2+2x+1`, '(((x)^(2))+(2*x)+1)'],
    [L`\frac{x^2-1}{x-1}`, '(((((x)^(2))+-1))/((x+-1)))'],
    [L`\sin(x)\cos(x)`, '(sin(x)*cos(x))'],
    [L`5!`, '(5)!'],
    // functions and constants
    [L`\sqrt{x}`, 'sqrt(x)'],
    [L`\sqrt[3]{x}`, '((x)^(1/(3)))'],
    [L`e^{x}`, '((e)^(x))'],
    [L`\ln(x)`, 'ln(x)'],
    [L`|x|`, 'abs(x)'],
    [L`\pi`, 'pi'],
    [L`i^2`, '-1'],
    [L`\infty`, '+infinity'],
    [L`\alpha+\beta`, '(alpha+beta)'],
    [L`a_1`, 'a_1'],
    // calculus
    [L`\lim_{x\to 0} \frac{\sin(x)}{x}`, 'limit(((sin(x))/(x)),x,0)'],
    [L`\lim_{x\to 0^+}\frac{1}{x}`, 'limit(((1)/(x)),x,0,1)'],
    [L`\lim_{x\to 0^-} \frac{1}{x}`, 'limit(((1)/(x)),x,0,-1)'],
    [L`\lim_{x\to 0^+} x\ln(x)`, 'limit((x*ln(x)),x,0,1)'],
    [L`\frac{d}{dx}\sin(x)`, 'diff(sin(x),x)'],
    [L`\int x^2\,dx`, 'int(((x)^(2)),x)'],
    [L`\int_0^1 x^2\,dx`, 'int(((x)^(2)),x,0,1)'],
    [L`\sum_{k=1}^{n} k`, 'sum(k,k,1,n)'],
    [L`\prod_{k=1}^{5} k`, 'product(k,k,1,5)'],
    // relations, assignment, collections
    [L`x:=3`, 'x:=3'],
    [L`x=2`, 'x=2'],
    [L`x\le 3`, 'x<=3'],
    [L`\begin{pmatrix}1&2\\3&4\end{pmatrix}`, '[[1,2],[3,4]]'],
    [L`[1,2,3]`, '[1,2,3]'],
    // CAS calls typed with \operatorname (MathLive inline shortcuts)
    [L`\operatorname{factor}\left(x^4-1\right)`, 'factor((((x)^(4))-(1)))'],
    [L`\operatorname{solve}\left(x^2-5x+6=0,x\right)`, 'solve(((((x)^(2))-((5*x)))+6)=0,x)'],
    [L`\operatorname{\mathrm{expand}}\left((x+1)^3\right)`, 'expand(((((x+1)))^(3)))'],
    [L`\operatorname{expand}\left(2x(x+1)\right)`, 'expand((2*x*((x+1))))'],
    [L`f(2)`, 'f(2)'],
    [L`\binom{5}{2}`, 'comb(5,2)'],
    // MathLive's "dx" shortcut inserts \differentialD
    [L`\frac{\differentialD}{\differentialD x}\sin(x)`, 'diff(sin(x),x)'],
    [L`\int_0^1 x^2\,\differentialD x`, 'int(((x)^(2)),x,0,1)'],
    [L`\operatorname{factor}\left(\sum_{k=1}^{n} k\right)`, 'factor(sum(k,k,1,n))'],
    [L`\operatorname{det}\begin{pmatrix}1&2\\3&4\end{pmatrix}`, 'det([[1,2],[3,4]])'],
  ];
  for (const [latex, giac] of cases) {
    it(latex, () => expect(toGiac(latex)).toBe(giac));
  }

  it('never sends invisibleOperator(…) to Giac', () => {
    for (const latex of [L`ax^2+bx+c=0`, L`\operatorname{solve}\left(ax^2+bx+c=0,x\right)`, L`3\sin(x)`]) {
      expect(toGiac(latex)).not.toMatch(/invisibleOperator/i);
    }
  });

  test.todo('f(x):=x^2 keeps its parameter (currently "f:=((x)^(2))")', () => {
    expect(toGiac(L`f(x):=x^2`)).toBe('f(x):=((x)^(2))');
  });
});

describe('MATH-002 MathJSON shapes', () => {
  const fn = (body: unknown) => ['Function', ['Block', body], 'x'];
  it('one-sided limit written with Superplus / Superminus', () => {
    expect(mathJsonToGiac(['Limit', fn(['Divide', 1, 'x']), ['Superplus', 0]])).toBe('limit(((1)/(x)),x,0,1)');
    expect(mathJsonToGiac(['Limit', fn(['Divide', 1, 'x']), ['Superminus', 0]])).toBe('limit(((1)/(x)),x,0,-1)');
  });
  it('one-sided limit parsed as PseudoInverse (Compute Engine bug, upstream-bugs.md)', () => {
    expect(mathJsonToGiac(['Limit', fn(['Divide', 1, 'x']), ['PseudoInverse', 0]])).toBe('limit(((1)/(x)),x,0,1)');
    expect(mathJsonToGiac(['Limit', fn(['Divide', 1, 'x']), ['PseudoInverse', ['Error', "'missing'"]]])).toBe('limit(((1)/(x)),x,0,1)');
  });
  it('sums and products with Limits bounds', () => {
    expect(mathJsonToGiac(['Sum', 'k', ['Limits', 'k', 1, 'n']])).toBe('sum(k,k,1,n)');
    expect(mathJsonToGiac(['Product', 'k', ['Limits', 'k', 1, 5]])).toBe('product(k,k,1,5)');
  });
  it('atoms', () => {
    expect(mathJsonToGiac(3)).toBe('3');
    expect(mathJsonToGiac(null)).toBe('');
    expect(mathJsonToGiac('Nothing')).toBe('');
  });

  // Shapes produced by Compute Engine >= 0.16x
  it('one-sided limit with the direction as 3rd operand: ["Limit", fn, 0, 1]', () => {
    expect(mathJsonToGiac(['Limit', ['Function', ['Divide', 1, 'x'], 'x'], 0, 1])).toBe('limit(((1)/(x)),x,0,1)');
  });
  it('sums with Tuple bounds: ["Sum", body, ["Tuple", k, 1, n]]', () => {
    expect(mathJsonToGiac(['Sum', 'k', ['Tuple', 'k', 1, 'n']])).toBe('sum(k,k,1,n)');
  });
  it('unresolved juxtaposition: ["InvisibleOperator", 5, "x"] is a product', () => {
    expect(mathJsonToGiac(['InvisibleOperator', 5, 'x'])).toBe('(5*x)');
  });
});

describe('LaTeX helpers', () => {
  it('normalizeOperatorname strips \\mathrm', () => {
    expect(sb.fn('normalizeOperatorname')(L`\operatorname{\mathrm{solve}}`)).toBe(L`\operatorname{solve}`);
  });
  it('extractCasFunctionCall splits top-level arguments only', () => {
    const r = plain(sb.fn('extractCasFunctionCall')(L`\operatorname{subst}\left(f\left(x,y\right),x,2\right)`));
    expect(r).toEqual({ func: 'subst', args: [L`f\left(x,y\right)`, 'x', '2'] });
  });
  it('extractCasFunctionCall returns null for non-CAS LaTeX', () => {
    expect(sb.fn('extractCasFunctionCall')(L`x^2+1`)).toBeNull();
  });
});

describe('MathLive adapter (the only reader of MathJSON from a math field)', () => {
  it('mathFieldToMathJson gives the canonical MathJSON', () => {
    expect(plain(mathFieldToMathJson(field(L`2x`)))).toEqual(['Multiply', 2, 'x']);
  });
  it('mathFieldToMathJson normalises \\differentialD', () => {
    expect(plain(mathFieldToMathJson(field(L`\frac{\differentialD}{\differentialD x}\sin(x)`)))).toEqual(['D', ['Sin', 'x'], 'x']);
  });
  it('mathFieldToMathJson returns null for an empty field', () => {
    expect(mathFieldToMathJson(field('  '))).toBeNull();
  });
  it('setMathFieldMathJson writes LaTeX', () => {
    const mf = field('');
    sb.fn('setMathFieldMathJson')(mf, ['Divide', 1, 'x']);
    expect(mf.value).toBe(L`\frac{1}{x}`);
  });
});

describe('PLT-008 the Compute Engine of the tests is the one the app loads', () => {
  it('package.json devDependency = CDN version in index.html', () => {
    const html = readFileSync(join(ROOT, 'index.html'), 'utf8');
    const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')) as { devDependencies: Record<string, string> };
    expect(html.match(/@cortex-js\/compute-engine@([\d.]+)/)?.[1]).toBe(pkg.devDependencies['@cortex-js/compute-engine']);
  });
});
