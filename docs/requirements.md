---
description: EARS requirements of CAScad with MoSCoW priorities and implementation status.
---

# Requirements specification

- Status: Draft v1 (2026-10-02), describing CAScad 0.1.3 and the work planned next
- Notation: [EARS](https://alistairmavin.com/ears/) (Easy Approach to Requirements Syntax)
- Prioritisation: MoSCoW — **M**ust / **S**hould / **C**ould / **W**on't (this time)
- Status: ✅ implemented · 🚧 partly implemented · 📋 planned
- Same conventions as [Progressive Web Office](https://github.com/s-celles/progressive-web-office/blob/main/docs/requirements.md) and [QRShare](https://github.com/s-celles/QRShare)

EARS templates used:

| Type | Template |
|------|----------|
| Ubiquitous | The system shall &lt;response&gt;. |
| Event-driven | When &lt;trigger&gt;, the system shall &lt;response&gt;. |
| State-driven | While &lt;state&gt;, the system shall &lt;response&gt;. |
| Unwanted | If &lt;condition&gt;, then the system shall &lt;response&gt;. |
| Optional | Where &lt;feature&gt;, the system shall &lt;response&gt;. |

Each requirement has an ID that tests may reference (`describe('REQ-xxx …')`).

## 1. Vision

A reactive notebook for **symbolic computation** that runs **entirely in the
browser** as an installable Progressive Web App. Users type mathematics
visually or in Giac syntax, cells recompute when what they depend on changes,
and results are shown as typeset formulas and interactive plots. Several
computer algebra kernels can be used (Giac by default). Notebooks stay on the
user's device unless the user chooses to share them.

## 2. Platform & architecture (PLT)

| ID | Pri | Status | Requirement |
|----|-----|--------|-------------|
| PLT-001 | M | ✅ | The system shall run entirely in the browser and shall not send notebook content to any server, except to a destination the user explicitly invokes (shared link, peer-to-peer transfer, QRShare). |
| PLT-002 | M | ✅ | The system shall be installable as a Progressive Web App (web app manifest and service worker). |
| PLT-003 | M | ✅ | While the device is offline, the system shall start from its cache and provide the features whose files were previously loaded. |
| PLT-004 | M | ✅ | When a new version of the application has been installed by the service worker, the system shall reload so that every file comes from the same version. |
| PLT-005 | M | ✅ | The system shall be built with Bun into a static site: new code in TypeScript with strict type checking, existing plain scripts copied as they are. |
| PLT-006 | M | ✅ | The build shall stamp the version, the commit and a hash of every precached file, so that any change installs a new service worker. |
| PLT-007 | M | ✅ | The continuous integration shall type-check, run the unit tests and build every change, and shall deploy the built site to GitHub Pages from the main branch. |
| PLT-008 | S | 🚧 | The system shall load third-party libraries at pinned versions (bundled dependencies or versioned CDN URLs). Some CDN libraries are still loaded without a pinned version. |
| PLT-009 | M | ✅ | The system shall work in the latest versions of Chromium-based browsers, Firefox and Safari. |

## 3. Notebook & cells (CELL)

| ID | Pri | Status | Requirement |
|----|-----|--------|-------------|
| CELL-001 | M | ✅ | The system shall present a notebook as an ordered list of cells of type math, raw (Giac syntax), text (Markdown) or slider. |
| CELL-002 | M | ✅ | When the notebook is empty, the system shall show an empty state with a button that adds a first cell. |
| CELL-003 | M | ✅ | When the system starts without a notebook to open, it shall show a welcome notebook (logo and introduction). |
| CELL-004 | M | ✅ | When the user clicks an insert zone above or below a cell, the system shall insert a new math cell there and focus it. |
| CELL-005 | M | ✅ | When the user clicks the type badge of a cell, the system shall change its type in the order math → raw → text and keep its content. |
| CELL-006 | M | ✅ | When the user switches a math cell between visual and raw mode, the system shall convert its content (LaTeX ↔ Giac syntax) and restore the original LaTeX if the raw text was not edited. |
| CELL-007 | M | ✅ | When the user moves a cell up or down, or drags it by its handle onto another cell, the system shall reorder the notebook. |
| CELL-008 | M | ✅ | When the user deletes a cell, the system shall remove it; while the reactive dependency graph is built, it shall mark the cells that depended on it as having a broken dependency. |
| CELL-009 | S | ✅ | When the user hides a cell (Ctrl+Shift+H), the system shall hide its input and keep its output; while the output is empty, it shall show a placeholder that shows the cell again. |
| CELL-010 | S | ✅ | While a cell is disabled (Ctrl+Shift+D), the system shall skip it during execution and show it dimmed. |
| CELL-011 | S | ✅ | While a cell is locked (Ctrl+Shift+L), the system shall prevent editing its input. |
| CELL-012 | C | ✅ | Where the user turns on "Show MathJSON", the system shall show, for each math cell, the MathJSON and the Giac expression sent to the kernel. |

## 4. Math input (MATH)

| ID | Pri | Status | Requirement |
|----|-----|--------|-------------|
| MATH-001 | M | ✅ | The system shall let the user type mathematics visually in math cells (MathLive), with a virtual keyboard offering fractions, integrals, sums, products and Greek letters. |
| MATH-002 | M | ✅ | The system shall convert visual input to the kernel through MathJSON (visual input → MathJSON → kernel syntax), LaTeX being used only for display. |
| MATH-003 | S | ✅ | The system shall provide inline shortcuts for CAS function names, taking precedence over shorter built-in shortcuts, and shall disable the shortcuts that conflict with CAS names ("and", "or", "sub"). |
| MATH-004 | S | ✅ | When the user types `?` in an empty math cell, or the beginning of a command name, the system shall show a filterable list of commands, navigable with the arrow keys, Tab and Enter. |
| MATH-005 | C | ✅ | The system shall offer a context menu on math fields with CAS actions (factor, simplify, …). |

## 5. Kernels (KRN)

| ID | Pri | Status | Requirement |
|----|-----|--------|-------------|
| KRN-001 | M | ✅ | The system shall compute with the Giac computer algebra system compiled to JavaScript, loaded from the application itself. |
| KRN-002 | S | ✅ | The system shall also offer the CortexJS Compute Engine as a kernel. |
| KRN-003 | M | ✅ | When the user selects a kernel, the system shall start a new notebook with that kernel and remember it as the default kernel on this device. |
| KRN-004 | M | ✅ | If a kernel cannot be loaded, then the system shall show it as unavailable in the selector and keep the other kernel usable. |
| KRN-005 | M | ✅ | The system shall show the state of the Giac engine (loading, ready, error) in the header. |
| KRN-006 | M | ✅ | The system shall save the active kernel in the notebook file and restore it when the notebook is opened, if available. |

## 6. Execution & reactivity (EXE)

| ID | Pri | Status | Requirement |
|----|-----|--------|-------------|
| EXE-001 | M | ✅ | When the user presses Shift+Enter in a cell (or Enter in a math cell), the system shall evaluate that cell. |
| EXE-002 | M | 🚧 | When the user presses Ctrl+Enter in a cell, the system shall evaluate it and add a new cell after it. The new cell is currently added at the end of the notebook. |
| EXE-003 | M | ✅ | When the user selects "Run all", the system shall evaluate every cell in order (or the whole dependency graph in reactive mode). |
| EXE-004 | M | ✅ | While reactive mode is on and the dependency graph is built, when a cell that defines a variable (`name := …`) changes, the system shall re-evaluate the cells that use it, in dependency order. |
| EXE-005 | S | ✅ | When the user presses Ctrl+Shift+Enter, the system shall evaluate the cell without re-evaluating its dependents. |
| EXE-006 | M | ✅ | While reactive mode is on, the system shall mark cells as unevaluated, pending or stale until they are evaluated. |
| EXE-007 | M | ✅ | If two cells define the same variable, or a cell depends on a cell that failed or was deleted, then the system shall show a warning on the cells concerned. |
| EXE-008 | S | ✅ | When the application starts in reactive mode, the system shall not evaluate the notebook until the user confirms (Run all), and shall offer to switch to manual mode instead. |
| EXE-009 | S | ✅ | When the user turns reactive mode off, the system shall discard the dependency graph and evaluate cells only on request. |
| EXE-010 | S | 📋 | If cells form a dependency cycle, then the system shall name the cells of the cycle in a warning instead of evaluating them. |

## 7. Output & plots (OUT)

| ID | Pri | Status | Requirement |
|----|-----|--------|-------------|
| OUT-001 | M | ✅ | The system shall render results as typeset formulas (KaTeX) together with the raw result. |
| OUT-002 | M | ✅ | If an evaluation fails, then the system shall show the error message in the cell output and mark the cell. |
| OUT-003 | S | ✅ | The system shall show the warnings and information messages printed by Giac during an evaluation. |
| OUT-004 | M | ✅ | The system shall render 2D plots as interactive graphs (JSXGraph: zoom, pan) for `plot`, `plotfunc`, `plotimplicit`, `plotfield`, `plotcontour`, `plotode` and `plotseq`, and other plots (`plotparam`, `plotpolar`, …) from Giac's own output (SVG or 2D drawing with zoom, pan and coordinates). |
| OUT-005 | S | ✅ | The system shall render 3D surfaces, parametric surfaces and curves and vector fields (JSXGraph 3D, or Giac's WebGL renderer), rotatable with the mouse; if 3D cannot be rendered, it shall say so. |
| OUT-006 | S | ✅ | The system shall render statistical charts (`histogram`, `barplot`, `camembert`, `boxwhisker`, `scatterplot`) and geometry (`circle`, `segment`, `point`, …). |

## 8. Text & interactive cells (TXT)

| ID | Pri | Status | Requirement |
|----|-----|--------|-------------|
| TXT-001 | M | ✅ | The system shall render text cells as Markdown (headings, emphasis, code, images) with inline and display LaTeX formulas. |
| TXT-002 | M | ✅ | The system shall escape HTML typed in text cells before rendering them. |
| TXT-003 | S | ✅ | Where a text cell contains `@bind(name, min, max, step, value[, "label"])`, the system shall show a slider bound to the variable `name`. |
| TXT-004 | S | ✅ | The system shall show slider cells (from notebook files and examples) whose parameters drive an expression and its plot, re-evaluated when a slider moves. |

## 9. Help & command discovery (HELP)

| ID | Pri | Status | Requirement |
|----|-----|--------|-------------|
| HELP-001 | M | ✅ | The system shall offer a command menu with categories and a search field that inserts the chosen command. |
| HELP-002 | M | ✅ | When the user evaluates `?command` or `help(command)`, the system shall show the command's description, syntax, examples and related commands. |
| HELP-003 | S | ✅ | The system shall provide discovery functions: `search_commands`, `search_commands_by_description`, `list_categories`, `commands_in_category`, `command_info`, `suggest_commands`, `list_commands` and `help_count`. |
| HELP-004 | S | ✅ | When the user clicks an example in the help, the system shall insert it in a cell (or run it). |
| HELP-005 | S | ✅ | The system shall offer example notebooks for each kernel from an Examples menu, and shall ask before replacing a non-empty notebook. |

## 10. Files (FILE)

| ID | Pri | Status | Requirement |
|----|-----|--------|-------------|
| FILE-001 | M | ✅ | When the user selects "Export", the system shall save the notebook as `notebook.cascad.json` (format version 5: kernel, locale, reactive mode, cells with their type, content and flags). |
| FILE-002 | M | ✅ | When the user selects "Import", the system shall open a CAScad, Giac or Xcas notebook file (format versions 1 to 5). |
| FILE-003 | M | ✅ | If the imported file is not valid JSON or not a notebook, then the system shall show an error and keep the current notebook. |
| FILE-004 | S | 📋 | When an action would replace a non-empty notebook (import, opening a link, QR code, transfer, kernel change), the system shall ask for confirmation first, as it does for examples. |
| FILE-005 | C | 📋 | The system shall keep the open notebook in browser storage and restore it after a reload. |

## 11. Sharing & transfer (SHARE)

| ID | Pri | Status | Requirement |
|----|-----|--------|-------------|
| SHARE-001 | M | ✅ | When the user asks for a link, the system shall put the compressed notebook in the URL fragment (`#nb=…`), which browsers do not send to any server. |
| SHARE-002 | S | ✅ | Where the user gives a password, the system shall encrypt the notebook in the link (`#nbe=…`, AES-GCM 256 with a key derived by PBKDF2-SHA-256, 100 000 iterations) and ask for the password when the link is opened. |
| SHARE-003 | M | ✅ | When the application is opened with a notebook link, the system shall open that notebook instead of the welcome notebook. |
| SHARE-004 | S | ✅ | The system shall show a notebook as a static QR code (link up to 2 200 characters), or otherwise as animated QR codes — fountain codes by default, or numbered chunks — with adjustable speed (1–12 frames/s) and chunk size. |
| SHARE-005 | S | ✅ | When the user scans QR codes with the camera ("Scan QR"), the system shall rebuild and open the notebook. |
| SHARE-006 | C | ✅ | The system shall transfer a notebook from a phone to a computer over a direct WebRTC connection (PeerJS), showing the same 4-digit code on both devices. |
| SHARE-007 | S | ✅ | Where the browser can share files, the system shall offer to share the notebook file with another application (system share sheet). |
| SHARE-008 | S | ✅ | When the user selects "Send to device", the system shall hand the notebook file to [QRShare](https://github.com/s-celles/QRShare) in the browser (QRShare app handoff protocol, version 1) with the chosen transfer policy (air-gapped only, prefer air-gapped, any mode). |
| SHARE-009 | S | ✅ | If the configured QRShare does not support the handoff protocol or does not answer within 15 s, then the system shall download the notebook and open QRShare's "Prepare a transfer" screen. |
| SHARE-010 | S | ✅ | When the user selects "Receive", the system shall open QRShare's receive screen with the address to return to; when QRShare opens CAScad with the received file, the system shall open the notebook. |
| SHARE-011 | M | ✅ | The system shall accept files handed over by QRShare only from the configured QRShare origin, and shall refuse files that are not notebooks. |
| SHARE-012 | S | ✅ | The system shall remember the transfer policy and the QRShare address (default `https://s-celles.github.io/QRShare/`) on this device. |

## 12. Real-time collaboration (COLLAB)

As in Progressive Web Office, with the collaboration engine shared with QRShare
(`@scelles/collab`: Yjs document, trystero peer-to-peer rooms found through
Nostr relays, presence and version history).

| ID | Pri | Status | Requirement |
|----|-----|--------|-------------|
| COLLAB-001 | S | 📋 | When the user starts a collaboration session, the system shall create an invitation link containing a room name and a secret, and offer it as a QR code, a link to copy, the share sheet, an e-mail and QRShare. |
| COLLAB-002 | S | 📋 | When several participants edit the notebook, the system shall merge their edits cell by cell: edits of different cells shall all be kept; concurrent edits of the same cell shall resolve to one of them, the same for everyone. |
| COLLAB-003 | S | 📋 | The system shall evaluate locally the cells changed by other participants, and shall not share outputs. |
| COLLAB-004 | S | 📋 | The system shall show who is in the session (friendly name and colour) and outline the cell each participant is working in. |
| COLLAB-005 | S | 📋 | When a participant saves a version, the system shall share it with everyone, and restoring a version shall first save the current state as a version. |
| COLLAB-006 | M | 📋 | The system shall exchange collaboration data directly between browsers, encrypted end to end; signalling relays shall never see the notebook. |
| COLLAB-007 | S | 📋 | When the application is opened with an invitation link, the system shall join the session and show the shared notebook once another participant is online. |

## 13. Views (VIEW)

| ID | Pri | Status | Requirement |
|----|-----|--------|-------------|
| VIEW-001 | S | ✅ | When the user selects "Report view" (Ctrl+Shift+R), the system shall hide the inputs and show only text and results. |
| VIEW-002 | C | ✅ | When the user opens "Flow", the system shall draw the dependency graph of the cells (Mermaid), coloured by state; clicking a node shall scroll to its cell. |

## 14. User interface (UI)

| ID | Pri | Status | Requirement |
|----|-----|--------|-------------|
| UI-001 | M | ✅ | The system shall use the visual style of QRShare and Progressive Web Office: palette, system typography, sticky header with brand, version and icon buttons, outlined buttons, card-style cells and dialogs, visible focus ring. |
| UI-002 | M | ✅ | When the user clicks the theme button, the system shall cycle between automatic (system setting), light and dark themes and remember the choice on this device. |
| UI-003 | M | ✅ | The system shall show its version and commit in the header; clicking them shall open the About window. |
| UI-004 | M | ✅ | The About window shall show the version (linked to the changelog), the commit (linked to the source), the build date, the licence, whether the app is installed and works offline, a QR code of the application (enlargeable full screen), links (getting started, source code, changelog, problem report, requirements), a privacy note and credits. |
| UI-005 | S | ✅ | The About window shall list the third-party libraries with their version, whether they are included in the application or loaded from a CDN, their licence and their author; the version of Giac shall be read from the engine. |
| UI-006 | S | ✅ | When the user selects "Requirements" in the About window, the system shall show this specification in the application, also offline. |
| UI-007 | S | ✅ | When the user selects "Copy details" in the About window, the system shall copy the version, address, browser and settings, to paste into a problem report. |
| UI-008 | M | ✅ | The layout shall work at phone width without horizontal scrolling of the page. |

## 15. Internationalisation (I18N)

| ID | Pri | Status | Requirement |
|----|-----|--------|-------------|
| I18N-001 | M | ✅ | The system shall be available in English, French, Spanish, German, Greek, Arabic, Hindi, Russian, Chinese and Japanese, every string being translated in every language. |
| I18N-002 | M | ✅ | When the user selects a language, the system shall translate the interface immediately and remember the choice. |
| I18N-003 | M | ✅ | While the language is Arabic, the system shall lay the interface out right to left, formulas staying left to right. |
| I18N-004 | S | ✅ | When the system starts without a remembered language, it shall use the browser's language if available, English otherwise. |
| I18N-005 | S | 🚧 | The system shall show the command help in the interface language. Arabic, Hindi, Japanese and Russian currently show the English help with a notice. |

## 16. Privacy & security (SEC)

| ID | Pri | Status | Requirement |
|----|-----|--------|-------------|
| SEC-001 | M | ✅ | The system shall keep its settings (language, kernel, theme, QRShare settings) in the browser's local storage only. |
| SEC-002 | M | 🚧 | The system shall not execute notebook content as JavaScript and shall escape user text before inserting it in the page. Some plot commands still compile the plotted expression to a JavaScript function. |
| SEC-003 | S | 🚧 | The system shall render formulas, images and plots from a notebook without allowing them to run scripts or load unexpected URLs. KaTeX currently runs in trusted mode, image URLs are not filtered and Giac SVG output is inserted as is. |
| SEC-004 | M | ✅ | The system shall accept messages from other windows (QRShare handoff) only from the expected window and origin, and shall validate their content (type, version, file name, size up to 200 MB). |
| SEC-005 | S | ✅ | The system shall never put a password in a link or send it anywhere. |
| SEC-006 | C | 📋 | The system shall apply a Content-Security-Policy restricting script sources to the application and its pinned CDN libraries. |
