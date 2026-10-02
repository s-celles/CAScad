/**
 * Third-party libraries of the app, with their versions: bundled ones from
 * package.json, CDN ones from the URLs of index.html and js/*.js. Shown in the
 * About window (UI-005); every version must be pinned (PLT-008).
 */
import { existsSync, readdirSync, readFileSync } from 'fs';
import { join } from 'path';

export interface Dependency {
  name: string;
  /** Version asked for: exact ("1.2.3"), major only ("3") or "latest" when the URL pins none. */
  version: string;
  /** Bundled into the build (npm), or loaded from a CDN at run time. */
  source: 'bundled' | 'cdn';
}

/** Runtime dependencies from package.json, with the installed versions. */
export function bundledDependencies(root: string): Dependency[] {
  const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')) as { dependencies?: Record<string, string> };
  return Object.keys(pkg.dependencies ?? {}).map((name) => {
    const installed = join(root, 'node_modules', name, 'package.json');
    const version = existsSync(installed) ? (JSON.parse(readFileSync(installed, 'utf8')) as { version: string }).version : pkg.dependencies![name]!;
    return { name, version, source: 'bundled' as const };
  });
}

/** Libraries loaded from a CDN by index.html and js/*.js, with the version their URL asks for. */
export function cdnDependencies(root: string): Dependency[] {
  const files = ['index.html', ...readdirSync(join(root, 'js')).filter((f) => f.endsWith('.js')).map((f) => `js/${f}`)];
  const found = new Map<string, string>();
  const patterns = [
    /https:\/\/(?:unpkg\.com|cdn\.jsdelivr\.net\/npm|esm\.sh)\/((?:@[\w.-]+\/)?[\w.-]+?)(?:@([\w.-]+))?(?=[/'"?)\s]|$)/g,
    /https:\/\/cdn\.jsdelivr\.net\/gh\/([\w.-]+)\/[\w.-]+?(?:@([\w.-]+))?(?=[/'"?)\s]|$)/g,
  ];
  for (const file of files) {
    const text = readFileSync(join(root, file), 'utf8');
    for (const pattern of patterns) {
      for (const [, name, pinned] of text.matchAll(pattern)) {
        if (!found.has(name!) || found.get(name!) === 'latest') found.set(name!, pinned ?? 'latest');
      }
    }
  }
  return [...found].map(([name, version]) => ({ name, version, source: 'cdn' as const }));
}

/** Every library, sorted by name. */
export function collectDependencies(root: string): Dependency[] {
  return [...bundledDependencies(root), ...cdnDependencies(root)].sort((a, b) => a.name.replace(/^@/, '').localeCompare(b.name.replace(/^@/, '')));
}
