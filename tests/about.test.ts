import { describe, expect, test } from 'bun:test';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { AUTHOR } from '../src/about';

const root = join(import.meta.dir, '..');

describe('UI-004 About window: author', () => {
  test('names Sébastien Celles, linked to the GitHub profile', () => {
    expect(AUTHOR).toEqual({ name: 'Sébastien Celles', url: 'https://github.com/s-celles' });
  });

  test('package.json has the same author', () => {
    const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
    expect(pkg.author).toBe(`${AUTHOR.name} (${AUTHOR.url})`);
  });

  test('the "Author" label is translated in every language', () => {
    const dir = join(root, 'js/i18n');
    const files = readdirSync(dir).filter((f) => f.endsWith('.js'));
    expect(files.length).toBe(10);
    for (const file of files) expect(readFileSync(join(dir, file), 'utf8')).toMatch(/\baboutAuthor: '[^']+'/);
  });
});
