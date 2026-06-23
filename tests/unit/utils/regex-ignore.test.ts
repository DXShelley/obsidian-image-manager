import { describe, expect, it } from 'vitest';
import { matchRegexIgnorePattern, validateRegexIgnorePattern } from '@/utils/regex-ignore';

describe('regex ignore utilities', () => {
  it('matches the first pattern that applies to a path', () => {
    expect(matchRegexIgnorePattern('^assets/raw/\n\\.gif$', 'assets/raw/demo.gif')).toEqual({
      source: '^assets/raw/',
      target: 'assets/raw/demo.gif'
    });
  });

  it('reports invalid regex lines', () => {
    expect(validateRegexIgnorePattern('^ok$\n[broken')).toEqual(['[broken']);
  });
});
