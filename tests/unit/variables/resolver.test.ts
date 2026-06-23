import { describe, expect, it } from 'vitest';
import { VariableResolver } from '@/services/variable-resolver';

describe('VariableResolver', () => {
  it('replaces built-in variables', () => {
    const resolver = new VariableResolver();
    const context = resolver.createContext('Daily Note', 'photo 1');
    const value = resolver.resolve('{noteName}-{fileName}-{date}', context);

    expect(value).toContain('Daily_Note');
    expect(value).toContain('photo_1');
    expect(value).toMatch(/\d{4}-\d{2}-\d{2}/);
  });
});
