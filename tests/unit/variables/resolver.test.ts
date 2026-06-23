import { afterEach, describe, expect, it, vi } from 'vitest';
import { VariableResolver } from '@/services/variable-resolver';

describe('VariableResolver', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('replaces built-in variables', () => {
    const resolver = new VariableResolver();
    const context = resolver.createContext('Daily Note', 'photo 1');
    const value = resolver.resolve('{noteName}-{fileName}-{date}', context);

    expect(value).toContain('Daily_Note');
    expect(value).toContain('photo_1');
    expect(value).toMatch(/\d{4}-\d{2}-\d{2}/);
  });

  it('uses the same local timestamp for date and time fields', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 5, 24, 0, 5, 7));

    const resolver = new VariableResolver();
    const context = resolver.createContext('Daily Note', 'photo 1');

    expect(context.date).toBe('2026-06-24');
    expect(context.time).toBe('00-05-07');
  });

  it('resolves path templates with ${noteFileName} while preserving folders', () => {
    const resolver = new VariableResolver();
    const context = resolver.createContext('Daily Note', 'photo 1');

    expect(resolver.resolvePath('./assets/${noteFileName}', context)).toBe('./assets/Daily_Note');
  });

  it('reports unresolved variables for validation', () => {
    const resolver = new VariableResolver();

    expect(resolver.validatePattern('{noteName}-{missing}-${alsoMissing}')).toEqual(['missing', 'alsoMissing']);
  });

  it('collapses duplicate adjacent variables when they resolve to the same value', () => {
    const resolver = new VariableResolver();
    const context = {
      noteName: '2026-06-23',
      noteFileName: '2026-06-23',
      fileName: 'image',
      date: '2026-06-23',
      time: '15-29-07',
      random: 'abc12345'
    };

    expect(resolver.resolve('{noteName}-{date}-{time}', context)).toBe('2026-06-23-15-29-07');
    expect(resolver.resolve('{noteFileName}-{date}-{random}', context)).toBe('2026-06-23-abc12345');
  });
});
