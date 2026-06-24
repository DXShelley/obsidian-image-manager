import { describe, expect, it } from 'vitest';
import { LinkFormat, type ParsedLink } from '@/types/index';
import {
  decodeLinkPathSafely,
  getParsedLinkResolutionCandidates,
  getRawLinkResolutionCandidates,
  normalizeLinkResolutionTarget
} from '@/utils/link-resolution';

describe('link-resolution', () => {
  it('returns both raw and decoded candidates for encoded markdown paths', () => {
    expect(getRawLinkResolutionCandidates('assets/%E6%89%AF%E7%9A%AE/test.png')).toEqual([
      'assets/%E6%89%AF%E7%9A%AE/test.png',
      'assets/扯皮/test.png'
    ]);
  });

  it('normalizes preview query strings before resolution', () => {
    expect(getRawLinkResolutionCandidates('assets/%E6%89%AF%E7%9A%AE/test.png?cache=1')).toEqual([
      'assets/%E6%89%AF%E7%9A%AE/test.png',
      'assets/扯皮/test.png'
    ]);
  });

  it('keeps literal unicode paths stable', () => {
    expect(getRawLinkResolutionCandidates('assets/扯皮/test.png')).toEqual([
      'assets/扯皮/test.png'
    ]);
  });

  it('derives candidates from parsed links without duplicates', () => {
    const parsed: ParsedLink = {
      path: 'assets/扯皮/test.png',
      rawPath: 'assets/%E6%89%AF%E7%9A%AE/test.png',
      format: LinkFormat.MARKDOWN
    };

    expect(getParsedLinkResolutionCandidates(parsed)).toEqual([
      'assets/%E6%89%AF%E7%9A%AE/test.png',
      'assets/扯皮/test.png'
    ]);
  });

  it('decodes safely and leaves invalid paths unchanged', () => {
    expect(decodeLinkPathSafely('%E0%A4%A')).toBe('%E0%A4%A');
    expect(normalizeLinkResolutionTarget(' assets/test.png#view ')).toBe('assets/test.png');
  });
});
