[![DOI](https://zenodo.org/badge/1167872975.svg)](https://doi.org/10.5281/zenodo.18846989)
[![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/s-celles/CAScad)

# CAScad

![CAScad](assets/CAScad.png)

A reactive notebook for symbolic computation, with the
[Giac](https://www-fourier.univ-grenoble-alpes.fr/~parisse/giac.html) computer algebra system.

**Open the app: https://s-celles.github.io/CAScad/** — it runs entirely in your
browser, installs as a Progressive Web App and works offline.

## Highlights

- Type mathematics **visually** or in Giac syntax; results as formulas
- **Reactive** cells that recompute when what they depend on changes
- Interactive 2D and 3D **plots**, statistical charts, geometry, sliders
- Two kernels: **Giac** and the CortexJS **Compute Engine**
- Command menu, help and discovery functions for the Giac commands
- Send notebooks to other devices with [QRShare](https://github.com/s-celles/QRShare), links or QR codes
- 10 languages, light and dark themes

## Documentation

The documentation opens **in the app** (? button in the header):

- [User guide](https://s-celles.github.io/CAScad/#/docs?page=user-guide) · [Guide utilisateur](https://s-celles.github.io/CAScad/#/docs?page=user-guide&lang=fr)
- [Sharing and transfer](https://s-celles.github.io/CAScad/#/docs?page=sharing) · [Partage et transfert](https://s-celles.github.io/CAScad/#/docs?page=sharing&lang=fr) — QRShare, links, QR codes, phone to computer
- [Architecture](https://s-celles.github.io/CAScad/#/docs?page=architecture) — building blocks and source layout
- [Development](https://s-celles.github.io/CAScad/#/docs?page=development) — build, test and release
- [Requirements](https://s-celles.github.io/CAScad/#/docs?page=requirements) — EARS specification

Its Markdown sources are in the [`docs/`](docs/) folder.

## Related projects

CAScad shares its visual style and its QRShare integration with
[Progressive Web Office](https://github.com/s-celles/progressive-web-office), an
office suite that runs entirely in the browser.

## Quick start

```bash
bun install
bun test
bun run dev     # build and serve on http://localhost:3000
```

See [Development](https://s-celles.github.io/CAScad/#/docs?page=development) for all commands and the release process.

## License

[GNU AGPL-3.0-or-later](LICENSE.txt)
