# Development

## Set-up

Requires [Bun](https://bun.sh) (and optionally [just](https://github.com/casey/just)).

```bash
bun install
bun run dev        # build into dist/ and serve it on http://localhost:3000
```

The app is built into `dist/`: the plain scripts of `js/` are copied as they
are, the TypeScript of `src/` is bundled next to them, and the documentation of
`docs/` is bundled into the app. Serving the repository root directly does not
work.

`giac.js` (the Giac engine, asm.js build) is in the repository; to update it,
download [giacjs.tar.gz](https://www-fourier.univ-grenoble-alpes.fr/~parisse/giacjs.tar.gz)
and replace it.

## Commands

```bash
bun run typecheck   # tsc --noEmit
bun test            # unit and integration tests (real Compute Engine and Giac)
bun run test:e2e    # end-to-end tests of the built app in Chromium (Playwright)
bun run build       # build dist/
bun run serve       # serve dist/ on http://localhost:3000
```

`just preflight` runs the type check, the tests and the build: run it before
committing.

The first time, install the browser of the end-to-end tests with
`bunx playwright install chromium`.

### Tests

- `tests/*.test.ts` — unit tests (`bun test`). The plain scripts of `js/` are
  loaded into a `node:vm` sandbox (`tests/helpers/sandbox.ts`), so their
  functions can be tested without a browser.
- `tests/mathjson-giac.test.ts` — visual input → MathJSON → Giac syntax, with
  the real Compute Engine (devDependency, same version as the CDN URL of
  `index.html`). Known bugs are listed as `test.todo`.
- `tests/giac-pipeline.test.ts` — integration with the real Giac engine
  (`giac.js`, run in a Worker by `tests/helpers/giac-worker.ts`): math cells end
  to end and every non-graphic cell of the Giac examples.
- `tests/e2e/*.e2e.ts` — end-to-end tests (Playwright) of the built app: start,
  pinned libraries, math and raw cells, errors, export → import, both kernels,
  every example notebook. `bun run test:e2e` builds `dist/` and serves it on
  port 4173 (`E2E_PORT`).

## Conventions

- **New code in TypeScript** in `src/` (strict mode), with unit tests in
  `tests/`. What inline handlers or the scripts of `js/` need is exposed on
  `window` by `src/main.ts`.
- **Existing code in `js/`**: plain JavaScript loaded in order by
  `index.html`, migrated to TypeScript progressively.
- **Translations**: every user-visible string goes through `t()` and exists in
  the 10 files of `js/i18n/`.
- **Dependencies**: exact versions only (`package.json`, or CDN URLs with
  `@x.y.z`); `tests/dependencies.test.ts` refuses anything else. They appear
  automatically in **About → Libraries** (`scripts/dependencies.ts`).
- **Requirements**: when a behaviour changes, update
  [the requirements](requirements.md) (ID, priority, status) and reference the
  ID in the tests.
- Commits follow [Conventional Commits](https://www.conventionalcommits.org/).

See also `CONTRIBUTING.md`.

## Documentation

The pages of `docs/` are shown in the app (header ? button, About links) and
on GitHub. Each page is a Markdown file; links between pages use the file name
(`[Sharing](en-sharing.md)`) and stay in the app. To add a page: create the file
in `docs/`, list it in `src/docs.ts` and add its title and description to the
translations (`docsPage_<slug>`, `docsDesc_<slug>`).

A page can be translated: write `docs/<lang>-<name>.md` and add it to the
`files` and `content` of its entry in `src/docs.ts` (the user guide and the
sharing page exist in French). The app shows a page in the interface language
when it exists, in English otherwise, with a note.

The pages open directly at `https://s-celles.github.io/CAScad/#/docs?page=<slug>`
(and `&section=<heading-anchor>`, `&lang=fr`).

## Deployment

The `CI` workflow (`.github/workflows/ci.yml`) type-checks, tests and builds
every push and pull request, and deploys `dist/` to GitHub Pages from `main`
(repository settings → Pages → Source: **GitHub Actions**).

The build stamps the version and commit into `js/boot.js`, and a hash of every
precached file (`SHELL_FILES` in `sw.js`, plus the module chunks) into `sw.js`,
so any change installs a new service worker and refreshes the caches. It fails
if `SHELL_FILES` lists a file missing from `dist/`.

## Releasing a version

1. Bump `version` in `package.json` and add a `## [x.y.z]` section to `CHANGELOG.md`.
2. Commit, tag and push:
   ```bash
   git commit -am "chore: release vX.Y.Z"
   git tag vX.Y.Z
   git push && git push --tags
   ```

The project follows [Semantic Versioning](https://semver.org/) and
[Keep a Changelog](https://keepachangelog.com/).
