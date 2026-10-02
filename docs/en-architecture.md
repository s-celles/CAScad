# Architecture

CAScad is a static Progressive Web App: everything runs in the browser, there
is no server of its own. It is built with [Bun](https://bun.sh) into `dist/`
and published on GitHub Pages.

## Building blocks

| Part | Role |
|------|------|
| **Giac** (`giac.js`) | Computer algebra engine by Bernard Parisse, compiled to JavaScript (asm.js), shipped with the app. Called through `caseval`. |
| **CortexJS Compute Engine** | Parses LaTeX into MathJSON; second kernel. |
| **MathLive** | Visual math input (`<math-field>`) and virtual keyboard. |
| **MathJSON → Giac** (`js/mathjson-giac.js`) | Turns what is typed visually into Giac syntax. |
| **Observable Runtime** | Reactive dependency graph between cells. |
| **KaTeX** | Formulas in results and text cells. |
| **JSXGraph** | Interactive 2D and 3D plots; Giac's own SVG, 2D drawing and WebGL output otherwise. |
| **Mermaid** | Cell flow diagram. |
| **Lit** | Slider components. |
| **QRShare** (separate app) | Sending and receiving notebooks between devices. |

Libraries and their versions are listed in **About → Libraries**.

## Data flow

1. A math cell holds a MathLive field; its content is read as **MathJSON**
   (Compute Engine) and converted to **Giac syntax** (`js/mathjson-giac.js`).
   Raw cells are already in Giac syntax.
2. The expression is evaluated by the active **kernel** (`js/kernel-*.js`,
   `KernelRegistry`).
3. In reactive mode, each cell is a variable of the **Observable** runtime
   (`js/reactive-dag.js`): `name := …` defines `name`, and cells that use it
   are recomputed when it changes.
4. The result is shown as LaTeX (**KaTeX**), or as a plot
   (`js/plot-rendering.js`).

## Source layout

```
index.html            HTML shell: header, toolbar, notebook, script order
css/notebook.css      All styles (light and dark themes)
js/                   Historical plain scripts, loaded in order by index.html
  state.js            Shared state (cells, modes)
  cells.js            Cells: creation, keys, modes, debug panel
  execution.js        Running a cell, text cells, sliders
  reactive-dag.js     Reactive graph (Observable Runtime)
  kernel-*.js         Kernel registry, Giac and Compute Engine kernels
  giac-init.js        Giac and Compute Engine set-up, MathLive shortcuts
  mathjson-giac.js    MathJSON → Giac
  plot-rendering.js   Plots
  command-*.js        Command menu, help, discovery functions
  io.js               Export, import
  qr-sharing.js       Links, QR codes, scanning
  p2p-transfer.js     Phone to computer transfer
  i18n.js, i18n/      Translations (10 languages)
  boot.js             Start-up, virtual keyboard
src/                  TypeScript, bundled by scripts/build.ts
  theme.ts            Theme (→ js/theme.js, loaded before first paint)
  main.ts             Module entry (→ js/app/main.js)
  about.ts            About window
  autosave.ts         Keeping the open notebook across reloads
  docs.ts, docs-view.ts, markdown.ts   In-app documentation
  share/              Sending and receiving with QRShare
docs/                 This documentation (Markdown, shown in the app)
tests/                Unit tests (bun test)
examples/             Example notebooks, per kernel
sw.js                 Service worker
scripts/              build.ts, serve.ts
```

## Storage and network

- Settings (language, kernel, theme, QRShare settings) and the open notebook
  (`src/autosave.ts`) are kept in the browser's local storage, on this device
  only. Export a notebook to keep a copy elsewhere.
- The service worker keeps the application for offline use; libraries loaded
  from a CDN are cached the first time they are used.
- Nothing is sent to a server, except when you share: link, QRShare, or the
  phone-to-computer transfer (signalling server, then a direct connection).

## Related projects

- [Giac/Xcas](https://www-fourier.univ-grenoble-alpes.fr/~parisse/giac.html), the computer algebra system by Bernard Parisse
- [QRShare](https://github.com/s-celles/QRShare), air-gapped file transfer with animated QR codes
- [Progressive Web Office](https://github.com/s-celles/progressive-web-office), an office suite in the browser, with the same visual style and QRShare integration

The virtual keyboard layout is inspired by
[B. Parisse's math2d.html](https://www-fourier.univ-grenoble-alpes.fr/~parisse/test/math2d.html).
