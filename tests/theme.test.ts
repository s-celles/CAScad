import { describe, expect, test } from 'bun:test';
import { nextTheme, parseTheme, resolveTheme } from '../src/theme';

describe('theme', () => {
  test('the header button cycles auto → light → dark → auto', () => {
    expect(nextTheme('auto')).toBe('light');
    expect(nextTheme('light')).toBe('dark');
    expect(nextTheme('dark')).toBe('auto');
  });

  test('auto follows the system setting', () => {
    expect(resolveTheme('auto', true)).toBe('dark');
    expect(resolveTheme('auto', false)).toBe('light');
    expect(resolveTheme('light', true)).toBe('light');
    expect(resolveTheme('dark', false)).toBe('dark');
  });

  test('an unknown stored value falls back to auto', () => {
    expect(parseTheme(null)).toBe('auto');
    expect(parseTheme('sepia')).toBe('auto');
    expect(parseTheme('dark')).toBe('dark');
  });
});
