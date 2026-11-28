# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- The header and the kernel selector show the name and version of each kernel ("Giac 2.1.0", "Compute Engine 0.169.2"), with the Giac build in use on hover (giac-wasm 200.100.0 or giac.js) (KRN-007); the Giac kernel is named "Giac" instead of "GIAC JS"
- Notebook format page in the in-app documentation (`docs/en-notebook-format.md`): the `.cascad.json` file (version 5) with its JSON Schema (`docs/notebook-v5.schema.json`, checked by the tests against every exported example), the `#nb=` and `#nbe=` links (lz-string line format, encryption) and the QRShare handoff, for applications that open notebooks in CAScad

### Changed
- Giac now runs as WebAssembly: giac-wasm 200.100.0 (GIAC 2.1.0, JuliaGiac/giac), a pinned release in `package.json` served by the app from `giac-wasm/200.100.0/` and cached by the service worker from the first start. It loads faster than the asm.js build (`giac.wasm` is 3.3 MB compressed, against 19.9 MB of JavaScript), gives exact results without an appended approximation (`1/3`), well-formed SVG plots and a 30 s time limit per evaluation. The asm.js build (`giac.js`) remains a fallback where giac-wasm cannot be loaded, or with `?giac=asm`
- Third-party dependencies may also be the asset of a GitHub release of an exact version, locked by its integrity hash in `bun.lock` (PLT-008)

### Fixed
- After a change of language, the header said "Loading Giac…" again although Giac was ready
- The About window showed no version for Giac once it ran as giac-wasm
- A math cell switched to Giac syntax came back as a visual math cell holding Giac text after an import, and after every reload (the notebook kept in the browser); it now comes back in Giac syntax
- A math cell switched to Giac syntax was sent empty in links and QR codes (`#nb=`, `#nbe=`, animated QR); it now travels as a Giac cell (`X:`)
- No more "Mathfield not mounted" error when a math field is removed right after it is created (cell switched to Giac syntax on import or by a collaborator): with MathLive 0.111, configuring the field or its menu after its removal threw

## [0.2.0] - 2026-11-28

### Security
- Plot commands drawn directly in the browser (`plotimplicit`, `plotfield`, `plotcontour`, `plotode`, `plotseq`, 3D fallbacks) only compile plain arithmetic on the plot variables and `Math` functions; anything else falls back to Giac's drawing, so a notebook cannot run code through a plot. Pixon data is evaluated only when it is an array of numbers
- A notebook (which may come from a shared link) can no longer run scripts when it is displayed: text cells escape quotes too, so an image address or a `@bind` name cannot add HTML attributes (such as `onerror`); images are only loaded from http(s), data or relative addresses; KaTeX only trusts `\href`/`\url` to http(s) (no more `\htmlClass`, `\includegraphics`…); Giac's SVG output is cleaned of scripts, embedded documents, animations, event handlers and unsafe links before it is shown

### Fixed
- In math cells, `f(2)` is a call of `f` (it was sent to Giac as `2*f`) and `\binom{5}{2}` is `comb(5,2)` (it was sent as an error string)
- Lists printed by Giac as `list[...]` (for example the result of `solve`) lost their first element when read as data for plots (`parseGiacList`)
- The CAScad icon now shows in the browser tab: the page declares `favicon.ico` (and the 192 px icon) instead of relying on the browser asking for `/favicon.ico` at the root of the site, which is not CAScad's on GitHub Pages (`s-celles.github.io/CAScad/`)
- Export → Import gives back the math cells exactly as typed: files now also keep their LaTeX (`latex`), because rebuilding them from MathJSON simplified them (`2+3` came back as `5`, `2^{10}` as `1\,024`); older files still open from their MathJSON
- A dependency cycle between reactive cells is now named on each cell of the cycle ("Dependency cycle: In[1] (b) → In[2] (a) → In[1]") instead of a generic runtime error
- Ctrl+Enter inserts the new cell right after the current one (it was added at the end of the notebook)
- Replacing a notebook the user has worked on now asks first: import, example, link, QR code, phone transfer, QRShare and kernel change (the welcome notebook is replaced without asking; examples no longer ask over it)
- Every library loaded from a CDN is pinned to an exact version (JSXGraph 1.13.3, Lit 3.3.3, Mermaid 11.17.2, Observable Runtime 6.0.1, lz-string 1.5.0, jsQR 1.4.0, luby-transform 0.2.0, @cheprasov/qrcode 0.1.0), as MathLive and Compute Engine already were: a new release can no longer break the app unnoticed. A test refuses unpinned URLs

### Changed
- MathLive 0.109.0 → 0.111.4 and Compute Engine 0.55.6 → 0.169.2 (the last version with a script-tag build). MathLive 0.111 has no `mf.expression` and no `math-json` output: math cells, export, the MathJSON view and the context menu now read MathJSON through one adapter (`mathFieldToMathJson` in `js/mathjson-giac.js`); `\differentialD` (inserted by the "dx" shortcut) is normalised before parsing; the conversion to Giac accepts the MathJSON forms of the newer Compute Engine (direction of one-sided limits as an operand, `Tuple` bounds, unresolved juxtapositions)
- Minimal README pointing to the in-app documentation; its detailed content moved to `docs/` (user guide, sharing and transfer, architecture, development) and was corrected (the phone-to-computer transfer has no confirmation step; `js/mathjson-giac.js`)
- About window aligned with QRShare and Progressive Web Office: version (linked to the changelog), commit (linked), build date, licence, installed/offline status, QR code of the app (click to enlarge full screen), links (getting started, source, changelog, report a problem), privacy note, credits, libraries in a collapsible table, and **Copy details** for bug reports. The social network share buttons are gone (the QR code and the system share sheet remain)
- TypeScript module `src/main.ts` bundled as `js/app/main.js` with code splitting, next to the plain scripts
- Build with Bun and TypeScript: `bun run build` produces `dist/` (plain scripts copied, TypeScript sources in `src/` bundled), deployed to GitHub Pages by the new `CI` workflow, which also type-checks and runs `bun test`. The theme toggle is the first module migrated to TypeScript (`src/theme.ts`)
- The version, commit and service worker cache hash are now stamped by the build: `scripts/update-sw-hash.js` and the manual hash commits are gone

### Added
- Roadmap page in the in-app documentation (`docs/en-roadmap.md`): quality, the move to giac-wasm, Compute Engine as a second kernel, architecture, the convergence with Progressive Web Office and the Giac ecosystem (OpenMath)
- Integration and end-to-end tests: visual input → MathJSON → Giac syntax with the real Compute Engine, the real Giac engine run in a Worker (math cells end to end and every non-graphic cell of the Giac examples), and Playwright tests of the built app (start, pinned libraries, cells, errors, export → import, both kernels, every example notebook), run by the CI; known bugs are recorded as `test.todo`
- The About window shows the author, Sébastien Celles, linked to https://github.com/s-celles (also in `package.json` and the README)
- Groundwork for real-time collaboration (as in Progressive Web Office): every cell has a stable identifier, kept in notebook files and in the saved notebook; `src/collab/` holds the invitation links, the notebook as shared parts (one per cell, plus their order), the Yjs binding ported from PWO (which also keeps local edits not sent yet when a remote change arrives) and the adapter that applies remote changes to the cells in place — tested, not yet connected to `@scelles/collab`
- The user guide and the sharing page are also in French (`docs/fr-guide-utilisateur.md`, `docs/fr-partage.md`); the documentation shows each page in the interface language when it exists, English otherwise (with a note); `&lang=fr` opens the French version from a link
- The open notebook is kept in the browser and comes back after a reload or when the app is reopened (unless a link opens another notebook); **🗋 New** starts a new notebook, after asking if the open one holds work
- In-app documentation, as in QRShare: the pages of `docs/` (user guide, sharing and transfer, architecture, development, requirements) open in the app from the header (?) and the About window, with an index, a list of pages and links between pages; addresses `#/docs?page=<page>[&section=<heading>]` open a page directly; bundled, so it works offline
- Requirements specification `docs/requirements.md`: about 100 requirements in EARS notation with MoSCoW priorities and their status (implemented, partly implemented, planned), including the planned real-time collaboration; readable in the app from **About → Requirements** (works offline) and checked by unit tests
- The About window lists the third-party libraries with their version, whether they are included in the app or loaded from a CDN, their licence and their author; Giac's version is read from the engine. The list is produced by the build from `package.json` and the CDN URLs
- Send to another device and receive from it with [QRShare](https://github.com/s-celles/QRShare), as in Progressive Web Office: **📲 Send to device** hands the notebook to QRShare inside the browser (handoff protocol v1, with a download fallback for older QRShare), offers the system share sheet and a link containing the notebook; **📥 Receive** opens QRShare's receive screen, and the received notebook comes back to CAScad. Policy and QRShare address are remembered
- Light/dark theme toggle in the header (auto → light → dark, follows the system setting in auto mode, persisted in `localStorage`)
- Help query support in math mode cells: `?commandname`, `help(commandname)`, `?`, and `help()` now work in visual (math2d) mode, producing identical output to raw mode cells
- Command autocomplete in math mode cells: typing `?` shows a filterable dropdown of available CAS commands with keyboard navigation (Arrow keys, Tab/Shift+Tab cycling, Enter/Escape) and mouse selection; Tab also completes plain command names without `?` prefix (e.g. `solv` + Tab → `solve`)

### Changed
- Visual style aligned with QRShare and Progressive Web Office: same palette, system typography, sticky header bar with brand badge, version link and icon buttons, outlined toolbar buttons, card-style cells and dialogs, yellow focus ring

### Fixed
- Math cells no longer evaluated (Enter / Shift+Enter did nothing): MathLive and Compute Engine were loaded unpinned from the CDN, and MathLive 0.111 removed `mf.expression` while recent Compute Engine releases no longer parse `\differentialD` (inserted by the `dx` shortcut). Both are now pinned (MathLive 0.109.0, Compute Engine 0.55.6)
- Only one "+" insert button is shown between two cells (it was doubled)

## [0.1.3] - 2026-03-03

### Fixed
- Remove custom HTML splash screen to avoid double splash on Android PWA

## [0.1.0] - 2026-03-03

### Added

- Base Conversions example notebook: decimal/binary/hex/octal conversions, `to_bin_str()`/`to_hex_str()` helpers, bitwise operations, RGB color decomposition, with i18n support (10 languages)
- Enter key executes math cells in visual mode (Shift+Enter still works for all cell types)
- Cell-to-diagram navigation: click `In[n]` label to open flow diagram and highlight the corresponding node
- Unevaluated cells styled with reduced opacity and dashed border (full opacity on focus)
- LaTeX round-trip preservation when switching between Math visual and Math raw modes (uses `latex(quote())` for Giac→LaTeX conversion)
- Cell flow diagram: toggleable Mermaid flowchart panel showing notebook cell dependency graph with error propagation visualization, live updates via MutationObserver, and i18n support (10 languages)
- P2P notebook transfer from phone to PC via WebRTC (no webcam required) — scan QR code on PC, verify 4-digit confirmation code, transfer notebook over encrypted data channel using PeerJS
- Programming example notebook: variables, conditionals (ifte, if/then/else), for/while loops, user-defined functions, recursion, list operations, Collatz conjecture, Newton's method (with multi-line code formatting)
- Display GIAC warnings/info messages in cell output (previously only visible in browser console)
- CAS function support in math-field: inline shortcuts for ~70 GIAC functions (expand, factor, csolve, etc.) with LaTeX normalization pipeline
- GIAC error detection: errors displayed as styled messages instead of garbled LaTeX rendering
- Avoid double evaluation: `caseval('latex(result)')` instead of re-evaluating the expression

- QR notebook sharing: share notebooks via static or animated QR codes
- Animated QR protocol (`XCAS:1:{i}:{total}:{crc}:{chunk}`) for large notebooks exceeding single QR capacity
- Camera-based QR scanner using jsQR for receiving shared notebooks
- Password-protected sharing with AES-GCM encryption (Web Crypto API) and `#nbe=` URL prefix
- URL-based notebook loading from hash fragment (`#nb=` unencrypted, `#nbe=` encrypted)
- Share QR dialog with copy URL, password field, animated QR controls (fps/chunk size sliders)
- Phone-to-PC transfer via Web Share API with Wake Lock support
- LZString compression for compact notebook serialization
- Fountain codes (LT codes) for QR notebook sharing: rateless erasure encoding eliminates the "last frame" problem — receiver can decode from any sufficient subset of packets (~k+10%)
- Encoding mode toggle in Share QR dialog: Fountain (default) or Sequential
- Scanner auto-detects fountain (`XCAS:F:`) vs legacy sequential (`XCAS:1:`) format
- Fountain encoder via `luby-transform` CDN library with CRC-32 frame validation
- Fountain decoder with incremental progress display ("Decoded X/K")
- Fountain codes work with password-encrypted notebooks (auto-detects encryption on decode)
- i18n keys for QR sharing features in all 9 locales
- Export format now includes `type: "xcas-notebook"` and `created` timestamp fields
- Import validates `type` field for `.xcas.json` files

- JSXGraph 3D surface plots: `plotfunc(expr,[x,y])`, `plot3d(expr,[x,y])`, and `plotparam3d([X,Y,Z],[u,v])` render interactive 3D surfaces via JSXGraph view3d
- JSXGraph 3D parametric curves: `plotparam3d([X,Y,Z],[t])` renders interactive 3D trajectories via JSXGraph `curve3d`
- 3D Curve (Helix) example with interactive slider for number of turns
- Support for explicit domain ranges in 3D plots (e.g., `[x=-3..3,y=-3..3]`)
- 3D examples: Surface, Parametric Surface, Surface + Sliders in the example library
- i18n keys for 3D plot features in all 9 locales

- MathJSON-first pipeline: math cells now use MathJSON as canonical internal representation instead of LaTeX
- Export format v3 with `mathjson` field for math cells
- Backward-compatible import of v2 notebooks (LaTeX content auto-converted to MathJSON)
- Fallback for unparseable v2 LaTeX: imported as raw cell with console warning
- `addCell()` accepts optional `initialMathJson` parameter

### Fixed

- 3D surface plots with external Giac variables (e.g., slider-bound `a`, `b`) now render correctly — `resolveGiacVars()` substitutes Giac variable values before creating JS functions

### Changed

- Split `js/examples.js` into individual files under `examples/` (one per notebook) for better maintainability
- 3D plot rendering uses JSXGraph native 3D API (view3d, functiongraph3d, parametricsurface3d) instead of Giac's Emscripten SDL/WebGL pipeline
- `getXcasExpr()` reads MathJSON directly from `mf.expression.json` instead of re-parsing LaTeX via `latexToXcas()`
- `updateDebug()` reads MathJSON directly from math-field instead of CortexJS `ce.parse()`
- `setCellMode()` uses `mf.expression.json` for math-to-raw conversion
- Export format version bumped from 2 to 3

### Removed

- One-sided limit LaTeX workaround (`limitDir` regex) in `latexToXcas()` — no longer needed with MathJSON-first pipeline
