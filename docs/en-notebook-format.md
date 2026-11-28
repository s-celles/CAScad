# Notebook format

How a CAScad notebook is stored and exchanged, for people and for other
applications (for example Progressive Web Office's "Open in CAScad"). A
notebook travels in two forms:

- a **file** (`.cascad.json`, format version 5), written by **Export** and
  read by **Import**, QRShare and phone-to-computer transfer: every cell with
  its settings;
- a **link** (`#nb=…`), which carries the notebook in the address itself: the
  cells only, compact enough for a QR code.

## File (format version 5)

A JSON object. The [JSON Schema](https://github.com/s-celles/CAScad/blob/main/docs/notebook-v5.schema.json)
(`docs/notebook-v5.schema.json`) describes it exactly; the tests check every
exported example against it.

| Field | Content |
|---|---|
| `version` | `5` |
| `type` | `"cascad-notebook"` |
| `kernel` | `"giac-js"` (default) or `"compute-engine"` |
| `locale` | interface language: `en`, `fr`, `es`, `de`, `el`, `ar`, `hi`, `ru`, `zh`, `ja` |
| `reactiveMode` | `true` or `false` |
| `created` | date and time of the export (ISO 8601) |
| `cells` | the cells, in order |

Every cell may have a `uid` (stable identifier, 4 to 64 letters, digits, `_`
or `-`) and the flags `hidden`, `disabled`, `locked`. The fields `defines` and
`references` (the reactive graph) and `mode` of non-math cells are written by
CAScad and ignored on import. Outputs are never stored: CAScad computes them
again.

| Cell | Fields |
|---|---|
| Math cell | `type: "math"`, `latex` (the LaTeX as typed in MathLive); `mathjson` is informative and ignored when `latex` is present |
| Math cell switched to Giac syntax | `type: "math"`, `mode: "raw"`, `content` (Giac syntax) |
| Raw cell | `type: "raw"`, `content` (Giac syntax) |
| Text cell | `type: "text"`, `content` (Markdown, `$…$` formulas, `@bind(name, min, max, step, value)` sliders) |
| Slider cell | `type: "slider"`, `params` (`name`, `label`, `min`, `max`, `step`, `value`), `expression` (Giac), `plotType` |

A minimal file:

```json
{
  "version": 5,
  "type": "cascad-notebook",
  "kernel": "giac-js",
  "cells": [
    { "type": "math", "latex": "\\frac{d}{dx}\\sin(x)" },
    { "type": "raw", "content": "factor(x^4-1)" },
    { "type": "text", "content": "## Notes\n$e^{i\\pi}+1=0$" }
  ]
}
```

Import also opens the older format versions 1 to 4, and Giac or Xcas
notebook files (`.giac.json`, `.xcas.json`).

## Link (`#nb=` and `#nbe=`)

`https://s-celles.github.io/CAScad/#nb=<data>` opens the notebook carried by
`<data>`. The fragment after `#` is never sent to a server.

`<data>` is a text compressed with lz-string 1.5.0
(`LZString.compressToEncodedURIComponent`). The text has one line per cell:

| Line | Cell |
|---|---|
| `M:<latex>` | math cell |
| `X:<giac>` | raw cell (also a math cell switched to Giac syntax, and the expression of a slider cell) |
| `T:<markdown>` | text cell |

Line breaks inside a cell are written `\n` (backslash, n). A link keeps neither
the kernel, the settings of the cells nor slider parameters: use a file for
those. Lines that do not start with `M:`, `X:` or `T:` are skipped.

```js
const text = ['M:\\frac{d}{dx}\\sin(x)', 'X:factor(x^4-1)'].join('\n');
const url = 'https://s-celles.github.io/CAScad/#nb=' + LZString.compressToEncodedURIComponent(text);
```

`#nbe=` is the same text, compressed then encrypted with a password:
AES-GCM 256 with a key derived by PBKDF2 (SHA-256, 100 000 iterations), sent
as URL-safe Base64 (no padding) of salt (16 bytes) + IV (12 bytes) +
ciphertext. CAScad asks for the password when the link is opened.

CAScad sets no maximum length. Keep links under about 8 KB so that messaging
apps and QR codes carry them; above that, send a file.

## Receiving from another application

Besides links and Import, CAScad receives files through
[QRShare](en-sharing.md) (handoff protocol v1). A `.cascad.json` file sent that
way opens like an imported one.
