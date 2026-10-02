# User guide

CAScad is a notebook for **symbolic computation** that runs entirely in your
browser. You type mathematics visually or in Giac syntax, cells recompute when
what they depend on changes, and results are shown as formulas and interactive
plots. It installs as an app and works offline.

## Getting started

1. Open <https://s-celles.github.io/CAScad/>. To install it, use your browser's
   *Install app* (or *Add to Home Screen*) command.
2. Wait until the header shows **Giac ready**.
3. Click **▶ Run all (reactive)** in the banner above the notebook, or **Cancel** to work cell by cell
   (see [Running cells](#running-cells)).
4. Add a cell with a **+** zone between cells, type `\frac{d}{dx}\sin x` (or
   `diff(sin(x),x)` in a raw cell) and press **Enter**.

Open **📚 Examples** for ready-made notebooks: arithmetic, algebra, calculus,
series, Fourier series, linear algebra, plots, 3D surfaces, physics, signal
processing, amplitude and frequency modulation with sliders, and more.

## The window

- **Header**: name and version (click it for *About*), kernel selector, Giac
  status, language, theme (◐ automatic, ☀ light, ☾ dark), documentation,
  source code and *About*.
- **Toolbar**: run all, clear outputs, export, import, examples, commands,
  sending and receiving, reactive mode, report view and cell flow diagram.
- **Bottom bar**: keyboard shortcuts and **Show MathJSON**.

## Cells

A notebook is a list of cells. Each cell has a header: the drag handle ⠿, its
index (`In[3]`, `Txt[1]`…), its **type badge**, and controls.

| Type | Content |
|------|---------|
| **Math** | Mathematics typed visually (formulas, fractions, integrals…). |
| **Raw** | Giac syntax, for example `factor(x^4-1)`. |
| **Text** | Markdown text with formulas between `$…$` or `$$…$$`. |
| **Slider** | Sliders driving an expression and its plot (in examples and notebook files). |

- **Add a cell**: click a **+** zone above or below a cell (it adds a math cell).
- **Change the type**: click the type badge (math → raw → text).
- **Math cells** switch between visual input **𝑓(𝑥)** and Giac syntax **{ }**.
- **Move** a cell with ↑ ↓, or drag it by its handle; **delete** it with ✕.
- **👁 Hide** (Ctrl+Shift+H) hides the input and keeps the result;
  **⊘ Disable** (Ctrl+Shift+D) skips the cell; **🔒 Lock** (Ctrl+Shift+L)
  prevents editing.

## Typing mathematics

Math cells use MathLive with a virtual keyboard (it opens when a cell has the
focus): fractions and derivatives, integrals and sums, transforms and physical
constants, letters and Greek letters.

- Type `/` for a fraction, `^` for a power, `_` for a subscript.
- CAS function names become functions as you type them (`factor`, `solve`,
  `laplace`…).
- Type `?` in an empty cell, or the start of a command and **Tab**, to choose a
  command from a list.
- Right-click a formula for **Rewrite** (factor, simplify, expand the
  selection) and **Math** (insert a function).
- **Show MathJSON** (bottom bar) shows how each math cell is understood.

## Running cells

| Keys | Action |
|------|--------|
| **Enter** (math cell) or **Shift+Enter** | Run the cell |
| **Ctrl+Enter** | Run the cell and add a new cell |
| **Ctrl+Shift+Enter** | Run the cell without updating its dependents |

### Reactive mode

With **Reactive** on (the default), a cell that defines a variable — `a := 5` —
updates the cells that use `a` when it changes, as in a spreadsheet. At start,
nothing runs until you click **▶ Run all (reactive)** in the banner above the notebook.

- A cell waiting for its inputs is marked *pending*; a cell not run yet is dimmed.
- Warnings tell you when two cells define the same variable, or when a cell
  depends on a cell that failed or was deleted.
- Turn **Reactive** off to run cells only when you ask.

## Kernels

| Kernel | Description |
|--------|-------------|
| **Giac** (default) | Full computer algebra system: algebra, calculus, plots, linear algebra, programming. Included in the app. |
| **Compute Engine** | CortexJS Compute Engine: simplify, factor, expand, solve, differentiate, integrate. |

Choosing a kernel in the header starts a new notebook with it; the choice is
remembered. A notebook file remembers its kernel.

## Results and plots

Results are shown as formulas, with the raw result below. Errors and Giac's
warnings appear in the cell.

- **2D plots**: `plot(sin(x))`, `plotfunc([sin(x),cos(x)],x)`,
  `plotimplicit(x^2+y^2-1,x,y)`, `plotfield`, `plotcontour`, `plotode`,
  `plotseq`, `plotparam`, `plotpolar` — zoom with the wheel, drag to pan.
- **3D**: `plotfunc(x^2+y^2,[x,y])`, `plot3d`, `plotparam3d` — drag to rotate.
- **Statistics**: `histogram`, `barplot`, `camembert`, `boxwhisker`, `scatterplot`.
- **Geometry**: `circle(0,2); segment([0,0],[2,0]); point(1,1)`.

## Text and sliders

Text cells use Markdown: `# Title`, `**bold**`, `*italic*`, `` `code` ``,
`![image](address)` and formulas `$x^2$` or `$$\int_0^1 x\,dx$$`. Run a text
cell (Shift+Enter) to show it formatted.

`@bind(a, 0, 10, 0.5, 2, "Amplitude")` in a text cell shows a slider for the
variable `a` (minimum, maximum, step, initial value, label): moving it updates
the cells that use `a`.

## Help and commands

- **🧮 Commands** browses the Giac commands by category, with a search field;
  a click inserts the command in the current cell.
- `?factor` or `help(factor)` shows the help of a command: description,
  syntax, examples (▶ runs one in a new cell) and related commands.
- Discovery functions: `search_commands("plot")`,
  `search_commands_by_description("prime")`, `list_categories()`,
  `commands_in_category("trigonometry")`, `command_info("solve")`,
  `suggest_commands("factr")`, `list_commands()`, `help_count()`.

## Views

- **📄 Report view** (Ctrl+Shift+R) hides the inputs: only text and results remain.
- **⛖ Flow** shows how cells depend on each other; click a node to go to its
  cell. Clicking a cell index (`In[3]`) shows it in the diagram.

## Files

- **💾 Export** saves the notebook as `notebook.cascad.json`.
- **📂 Import** opens a CAScad, Giac or Xcas notebook (`.json`).
- To send a notebook to someone or to another device, see
  [Sharing and transfer](en-sharing.md).

Opening a file, a link or a received notebook replaces the open notebook:
export it first if you want to keep it.

## Settings

The language, the theme and the default kernel are remembered on this device.
Arabic is shown right to left. *About* shows the version, the libraries in use
and links to this documentation.
