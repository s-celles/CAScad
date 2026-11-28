# Roadmap

Planned work and ideas for improvement. This is a planning document, not a
commitment. What the application does is specified in the
[requirements](requirements.md); released changes are in the changelog.

_Last review: 27 November 2026._

Legend: **P0** urgent, **P1** next minor release, **P2** medium term,
**P3** ideas. ☐ to do · ◐ in progress · ☑ done · ⏸ blocked.

## 1. Quality and dependencies (P1)

- ☑ Every CDN library pinned to an exact version (PLT-008).
- ☑ Integration tests with the real Compute Engine and the real Giac engine,
  and end-to-end tests of the built app in Chromium (PLT-007, see
  [Development](en-development.md)).
- ☑ MathLive 0.111.4 and Compute Engine 0.169.2. MathLive 0.111 removed
  `mf.expression` and the `math-json` output; one adapter
  (`mathFieldToMathJson` in `js/mathjson-giac.js`) now reads MathJSON from a
  math field.
- ☑ The [notebook format](en-notebook-format.md) is documented, with a JSON Schema
  checked by the tests (file v5 and `#nb=` links), for other applications
  such as Progressive Web Office's "Open in CAScad".
- ☐ `f(x):=x^2` typed in a math cell loses its parameter (sent as `f:=x^2`);
  recorded as a `test.todo`.
- ☐ The `physics-mechanics` example assigns `x := …` before `desolve(…, y)`,
  whose implicit variable is `x`. It only works because of the reactive
  evaluation order: running the cell again shows "Independant variable
  assigned".
- ☐ End-to-end tests in Firefox and WebKit (PLT-009); visual snapshots of plots.
- ☐ Test coverage report with a threshold.
- ☐ Subresource Integrity on the CDN tags, then a Content-Security-Policy
  (SEC-006).
- ☐ Automated update pull requests for the pinned versions, checked by the
  tests.

## 2. Giac engine: from asm.js to giac-wasm (P1, ◐ in progress)

**giac-wasm 200.100.0** (GIAC 2.1.0) is released (28 November 2026) and is
CAScad's engine. Version
`X00.Y00.Z00` is GIAC `X.Y.Z`, the last digits count rebuilds. The version
follows GIAC, not the JavaScript API, so it must be pinned exactly and its
changelog read before each upgrade. It is published by tag `giac-wasm-v*` on
[JuliaGiac/giac](https://github.com/JuliaGiac/giac/releases) and on
[GitHub Pages](https://s-celles.github.io/giac-wasm/versions.json).

| | `giac.js` (asm.js, fallback) | `giac-wasm` 200.100.0 (default) |
|---|---|---|
| Size | 19.9 MB of JavaScript | `giac.wasm` 3.3 MB gzip + 68 KB glue |
| Loading | classic script, global `Module` and `UI` stubs | ES module, `await loadGiac()` |
| Errors | `GIAC_ERROR:` strings | `GiacError` with the messages |
| Long computations | freeze the page | a time limit (30 s); later a Worker and a hard stop |
| Licence | GPL-3.0+ | GPL-3.0+ (GMP, MPFR: LGPL-3.0+), compatible with AGPL-3.0 |

Plan:

1. ☑ giac-wasm on the main thread (its synchronous `eval`), behind a `caseval()`
   compatibility layer for the 47 direct calls of `js/` (`js/giac-engine.js`):
   `GiacError` becomes the `GIAC_ERROR:` string, the messages go to the output
   panel (OUT-002, OUT-003); a 30 s limit per evaluation.
2. ☑ Behaviour differences: no appended `=approximation` (`1/3`), well-formed
   SVG (giac#24), Giac's own 3D disabled (CAScad draws 3D with JSXGraph).
3. ☑ giac-wasm cached by the service worker, from the first start (PLT-003).
4. ☑ giac-wasm by default, asm.js kept as a fallback (`?giac=asm`, or when
   giac-wasm cannot be loaded); unit, integration and e2e tests on both.
5. ☐ The kernel in a Worker with `createGiacWorker()` from `giac-wasm/worker`
   ([JuliaGiac/giac#21](https://github.com/JuliaGiac/giac/issues/21)): a Stop button,
   a hard stop of loops GIAC's limit misses. It needs the asynchronous `Kernel`
   interface (§4, step 3), since `caseval` is synchronous today.
6. ☐ Remove `giac.js`, `giacsimple.js` and `giacwasm.js` after one minor release
   (−57 MB in the repository).
7. ☐ Tests in Firefox and Safari (Safari needs 15.2 or later for giac-wasm).
8. ☐ `[x=1]` at the top level assigns in giac-wasm (`x=1` already did in
   asm.js): write top-level equations as `id(…)` when the OpenMath route
   arrives (`evalOpenMath` already does).

## 3. Compute Engine as a real second kernel (P1/P2)

Compute Engine 0.169.2 is the last version with a script-tag build: from
0.170.0 it is ES modules only (about 1.7 MB gzip), with new entries (`compile`,
`kernel-worker`, `interval`, the experimental Epsil language).

- ☐ Bundle Compute Engine from `package.json` into `src/` (the build already
  bundles TypeScript) instead of a CDN script, and expose the engine to `js/`.
  `js/giac-init.js` must then stop creating `ce` when it loads.
- ☐ Math cells: give the kernel the MathJSON of the field, not the Giac syntax
  produced by `getGiacExpr()` (KRN-002). Raw cells: Epsil instead of regular
  expressions, behind a flag while Epsil is experimental.
- ☐ Reactive cells and plots for the Compute Engine kernel (EXE-004, OUT-004).
- ☐ Help and completion from the engine's own documentation.
- ☐ Fast plots: `compile()` to plain JavaScript functions for JSXGraph and
  sliders, interval compilation for implicit plots.
- ☐ A cross-check mode that evaluates a cell with both kernels and shows
  disagreements; a kernel chosen per cell.

## 4. Architecture (P2)

Kernels, renderers and input editors should be replaceable without touching
the notebook core, and the core testable without a browser. New code goes to
TypeScript in `src/`, step by step, each step protected by the tests.

| Principle | Today |
|---|---|
| Single responsibility | `getGiacExpr()` reads the page, intercepts help queries, splits `;` and converts LaTeX. `runSingleCell()` dispatches kernels, renders, plots and drives the reactive graph. `plot-rendering.js` (1.9 kLOC) mixes sampling, parsing and drawing. |
| Open/closed | `execution.js` branches on `activeKernel.id !== 'giac-js'`: the Compute Engine kernel gets no plots and no reactivity. |
| Liskov substitution | Giac returns Giac text, Compute Engine returns LaTeX, and math cells give both a Giac-syntax string. |
| Interface segregation | One kernel object for evaluation, help, command list and LaTeX; 47 direct `caseval()` calls. |
| Dependency inversion | Globals (`ce`, `caseval`, `Module`, `MathfieldElement`, `cells`) and script order in `index.html`. |

Steps:

1. ☑ MathLive adapter: one place for the math-field MathJSON API.
2. ☐ A pure function that turns the content of a math cell into kernel input
   (help and discovery queries, `;`, routing), with unit tests.
3. ☐ An asynchronous `Kernel` interface in TypeScript:
   `evaluate({ latex, mathjson, text }) → Promise<Result>`, `interrupt()`,
   `reset()`, `capabilities`; a Giac adapter around `caseval()`. This is also
   where giac-wasm plugs in.
4. ☐ `Result` objects (expression, plot, help, error, messages) and a
   renderer registry, so that every kernel gets plots, errors and reactivity.
5. ☐ Split `plot-rendering.js` into parsers (pure, tested), samplers (kernel
   side) and renderers.
6. ☐ A notebook model without DOM: cells, file format and migrations,
   scheduler over the Observable runtime.
7. ☐ The remaining scripts of `js/` migrated to `src/`, without implicit globals.

## 5. Convergence with Progressive Web Office and the Giac ecosystem (P1/P2)

Decided on 27 November 2026: shared building blocks, and Giac as an engine of
the math cells of [Progressive Web Office](https://github.com/s-celles/progressive-web-office)
(its requirement CAS-007). CAScad is not merged into PWO (two runtimes, two
storage models, two sandbox models). PWO already has reactive math cells:
MathLive LaTeX → its own expression tree → SymPy in Pyodide.

| Building block | Home | Content |
|---|---|---|
| Giac ↔ OpenMath table | [JuliaGiac/giac-openmath](https://github.com/JuliaGiac/giac-openmath) | data only, shared with Giac.jl; explicit refusals of false friends |
| OpenMath → Giac | `giac-wasm/openmath`, `evalOpenMath()` ([JuliaGiac/giac#22](https://github.com/JuliaGiac/giac/issues/22)) | driven by the table, pinned commit |
| Worker | `giac-wasm/worker`, `createGiacWorker()` ([#21](https://github.com/JuliaGiac/giac/issues/21)) | start, timeout, interrupt, messages |
| MathJSON → OpenMath | a new shared package (name to confirm) | independent of any engine; used by CAScad and by PWO (through a small adapter from its tree to MathJSON) |

Results are still shown through Giac's `latex(...)`: Giac's text output is not
parsed. Structured results would need an `openmath(expr)` command in Giac.

**Why OpenMath and not MathML.** Presentation MathML describes layout, not
meaning: it brings back the ambiguities of juxtaposition (`f(x)`), of the `dx`
of integrals and of the bounds of limits and sums. Giac's own `mathml()`
produces Presentation MathML only. Strict Content MathML is OpenMath in another
syntax (same content dictionaries), so the giac-openmath table covers it too.
OpenMath (JSON) is used for meaning and computation, Presentation MathML at the
edges: documents (ODT, DOCX in PWO), native MathML rendering in browsers, Giac's
`mathml()` output.

Plan:

1. ☐ `giac-wasm/worker` first: both applications need it.
2. ☐ MathJSON → OpenMath, with the tested cases of CAScad as its test corpus;
   what the table does not cover yet (matrices, `:=`, lists, sequences) goes
   through a marked direct fallback, today's `mathJsonToGiac`.
3. ☐ More of the table: lists, linear algebra, assignment.
4. ☐ Later: CAScad notebooks converted to PWO Markdown (a requirement in PWO).

## 6. Features (P2/P3)

- ☐ Real-time collaboration (COLLAB-001 to COLLAB-007).
- ☐ Undo and redo across cells.
- ☐ Export as a standalone HTML report, LaTeX and PDF; import and export of
  Jupyter `.ipynb` and Xcas sessions.
- ☐ Errors located inside the math field.
- ☐ Accessibility: keyboard-only use, ARIA roles, spoken mathematics.
- ☐ Giac's Python-compatible syntax for students.
- ☐ Help texts of the machine-translated languages reviewed by native speakers.

## 7. Upstream follow-ups

- ☐ Compute Engine: the `0^{+}` → `PseudoInverse` parsing bug no longer
  appears in 0.169.2 (`["Limit", f, 0, 1]`); the workaround stays for older
  files. `\frac{\differentialD}{\differentialD x}` is not parsed (CAScad
  normalises `\differentialD` to `\mathrm{d}`).
- ☐ giac-wasm: npm publication (pinned versions with integrity hashes from
  jsDelivr) and a command-list API, e.g. `giac.commands(prefix)`.
