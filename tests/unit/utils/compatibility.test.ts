import { describe, expect, it } from 'vitest';
import { describeCurrentPlatform } from '@/utils/compatibility';

describe('describeCurrentPlatform', () => {
  it('returns an English platform label when requested', () => {
    expect(describeCurrentPlatform('en')).toBe('Desktop');
  });

  it('keeps the Chinese platform label by default', () => {
    expect(describeCurrentPlatform()).toBe('桌面端');
  });
});
