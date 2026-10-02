#!/usr/bin/env bun
/**
 * Production build: copies the static app into dist/, bundles the TypeScript
 * sources (src/) next to the plain scripts (js/), then stamps the version,
 * the commit and the service worker cache hash.
 */
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'fs';
import { createHash } from 'crypto';
import { join } from 'path';

const ROOT = join(import.meta.dir, '..');
const DIST = join(ROOT, 'dist');

/** Files and folders served as they are. */
const STATIC = [
  'index.html',
  'favicon.ico',
  'manifest.webmanifest',
  'sw.js',
  'giac.js',
  'giacsimple.js',
  'giacwasm.js',
  'css',
  'js',
  'assets',
  'examples',
];

/** TypeScript entries bundled to a classic script loaded by index.html (run before first paint). */
const ENTRIES: Record<string, string> = {
  'src/theme.ts': 'js/theme.js',
};

/** The module entry (index.html loads js/app/main.js); parts used on demand become separate chunks. */
const MODULE_ENTRY = 'src/main.ts';
const MODULE_DIR = 'js/app';

function fail(message: string): never {
  console.error(message);
  process.exit(1);
}

const version: string = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')).version;
const git = Bun.spawnSync(['git', 'rev-parse', '--short', 'HEAD'], { cwd: ROOT });
const commit = process.env.GITHUB_SHA?.slice(0, 7) || (git.exitCode === 0 ? git.stdout.toString().trim() : 'unknown');
/** A third-party library used by the app, shown in the About window. */
interface Dependency {
  name: string;
  /** Exact version, a major version range ("3"), or "latest" when the URL does not pin one. */
  version: string;
  /** Bundled into the build (npm), or loaded from a CDN at run time. */
  source: 'bundled' | 'cdn';
}

/** Runtime dependencies from package.json, with the installed versions. */
function bundledDependencies(): Dependency[] {
  const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')) as { dependencies?: Record<string, string> };
  return Object.keys(pkg.dependencies ?? {}).map((name) => {
    const installed = join(ROOT, 'node_modules', name, 'package.json');
    const version = existsSync(installed) ? (JSON.parse(readFileSync(installed, 'utf8')) as { version: string }).version : pkg.dependencies![name]!;
    return { name, version, source: 'bundled' as const };
  });
}

/** Libraries loaded from a CDN by index.html and js/*.js, with the version their URL asks for. */
function cdnDependencies(): Dependency[] {
  const files = ['index.html', ...readdirSync(join(ROOT, 'js')).filter((f) => f.endsWith('.js')).map((f) => `js/${f}`)];
  const found = new Map<string, string>();
  const patterns = [
    /https:\/\/(?:unpkg\.com|cdn\.jsdelivr\.net\/npm|esm\.sh)\/((?:@[\w.-]+\/)?[\w.-]+)(?:@([\w.-]+))?/g,
    /https:\/\/cdn\.jsdelivr\.net\/gh\/([\w.-]+)\/[\w.-]+(?:@([\w.-]+))?/g,
  ];
  for (const file of files) {
    const text = readFileSync(join(ROOT, file), 'utf8');
    for (const pattern of patterns) {
      for (const [, name, pinned] of text.matchAll(pattern)) {
        if (!found.has(name!) || found.get(name!) === 'latest') found.set(name!, pinned ?? 'latest');
      }
    }
  }
  return [...found].map(([name, version]) => ({ name, version, source: 'cdn' as const }));
}

const dependencies = [...bundledDependencies(), ...cdnDependencies()].sort((a, b) => a.name.replace(/^@/, '').localeCompare(b.name.replace(/^@/, '')));

const define = {
  __DEPENDENCIES__: JSON.stringify(dependencies),
  __APP_VERSION__: JSON.stringify(version),
  __GIT_COMMIT__: JSON.stringify(commit),
  __BUILD_DATE__: JSON.stringify(new Date().toISOString()),
};

rmSync(DIST, { recursive: true, force: true });
mkdirSync(DIST, { recursive: true });

// 1. Static app
for (const item of STATIC) {
  const src = join(ROOT, item);
  if (!existsSync(src)) fail(`Missing ${item}`);
  cpSync(src, join(DIST, item), { recursive: true });
}

// 2. TypeScript bundles
for (const [entry, out] of Object.entries(ENTRIES)) {
  const result = await Bun.build({
    entrypoints: [join(ROOT, entry)],
    target: 'browser',
    format: 'iife',
    minify: true,
    define,
  });
  if (!result.success) fail(`Build of ${entry} failed:\n${result.logs.join('\n')}`);
  writeFileSync(join(DIST, out), await result.outputs[0]!.text());
}

const moduleResult = await Bun.build({
  entrypoints: [join(ROOT, MODULE_ENTRY)],
  outdir: join(DIST, MODULE_DIR),
  target: 'browser',
  format: 'esm',
  splitting: true,
  minify: true,
  naming: { entry: '[name].js', chunk: '[name]-[hash].js' },
  define,
});
if (!moduleResult.success) fail(`Build of ${MODULE_ENTRY} failed:\n${moduleResult.logs.join('\n')}`);

// 3. Version and commit in the plain scripts
function stamp(file: string, replacements: [RegExp, string][]): void {
  const path = join(DIST, file);
  let text = readFileSync(path, 'utf8');
  for (const [pattern, value] of replacements) {
    if (!pattern.test(text)) fail(`${pattern} not found in ${file}`);
    text = text.replace(pattern, value);
  }
  writeFileSync(path, text);
}

stamp('js/boot.js', [
  [/var APP_VERSION = '[^']*'/, `var APP_VERSION = '${version}'`],
  [/var APP_COMMIT = '[^']*'/, `var APP_COMMIT = '${commit}'`],
]);

// 4. Service worker cache: the module chunks loaded on demand are precached
// too (they work offline), and a hash of every precached file makes any change
// install a new service worker and refresh the caches.
const chunks = readdirSync(join(DIST, MODULE_DIR)).filter((f) => f.endsWith('.js') && f !== 'main.js');
stamp('sw.js', [[/'\.\/js\/app\/main\.js',/, ["'./js/app/main.js',", ...chunks.map((f) => `'./${MODULE_DIR}/${f}',`)].join(' ')]]);
const sw = readFileSync(join(DIST, 'sw.js'), 'utf8');
const shellList = /var SHELL_FILES = \[([\s\S]*?)\];/.exec(sw)?.[1] ?? fail('SHELL_FILES not found in sw.js');
const shellFiles = [...shellList.matchAll(/'\.\/([^']+)'/g)].map((m) => m[1]!);
const hash = createHash('sha256');
for (const file of shellFiles) {
  const path = join(DIST, file);
  if (!existsSync(path)) fail(`sw.js precaches ${file}, which is not in dist/`);
  hash.update(file).update(readFileSync(path));
}
const cacheHash = hash.digest('hex').slice(0, 10);

stamp('sw.js', [
  [/var CACHE_HASH = '[^']*'/, `var CACHE_HASH = '${cacheHash}'`],
  [/var CACHE_VERSION = '[^']*'/, `var CACHE_VERSION = '${version}'`],
]);

console.log(`Built CAScad v${version} (${commit}) in dist/ — ${shellFiles.length} precached files, cache ${cacheHash}`);
console.log(`Dependencies: ${dependencies.map((d) => `${d.name}@${d.version}`).join(', ')}`);
