import { describe, expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = join(import.meta.dir, '..');
const read = (path: string): string => readFileSync(join(root, path), 'utf8');
const html = read('index.html');

/** The `href` and `sizes` of each `<link rel="icon">` of the page. */
const icons = [...html.matchAll(/<link rel="icon"([^>]*)>/g)].map((m) => ({
  href: /href="([^"]+)"/.exec(m[1]!)?.[1],
  sizes: /sizes="([^"]+)"/.exec(m[1]!)?.[1],
}));

/** The sizes stored in an ICO file (0 in the header means 256). */
function icoSizes(path: string): string[] {
  const data = readFileSync(join(root, path));
  return Array.from({ length: data.readUInt16LE(4) }, (_, i) => data[6 + 16 * i] || 256).map((n) => `${n}x${n}`);
}

describe('PLT-010 favicon', () => {
  test('the page declares favicon.ico with the sizes it holds', () => {
    const ico = icons.find((i) => i.href === 'favicon.ico');
    expect(ico).toBeDefined();
    expect(ico!.sizes!.split(' ')).toEqual(icoSizes('favicon.ico'));
  });

  test('the page also declares the 192 px PNG icon', () => {
    expect(icons).toContainEqual({ href: 'assets/icon-192.png', sizes: '192x192' });
  });

  test('the icons are relative (the app lives in a sub-folder) and precached for offline use', () => {
    const sw = read('sw.js');
    for (const { href } of icons) {
      expect(href).not.toStartWith('/');
      expect(sw).toContain(`'./${href}'`);
    }
  });
});
