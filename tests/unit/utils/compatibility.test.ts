import { afterEach, describe, expect, it, vi } from 'vitest';
import { detectObsidianDebugMode } from '@/utils/compatibility';

describe('detectObsidianDebugMode', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('prefers direct app debug mode access when available', () => {
    const app = {
      debugMode: () => true,
      loadLocalStorage: vi.fn(() => false)
    };

    expect(detectObsidianDebugMode(app as never)).toBe(true);
  });

  it('falls back to vault-scoped localStorage values', () => {
    const app = {
      loadLocalStorage: vi.fn((key: string) => (key === 'debug-mode' ? 'true' : null))
    };

    expect(detectObsidianDebugMode(app as never)).toBe(true);
  });

  it('falls back to window.localStorage when app storage is unavailable', () => {
    vi.stubGlobal('window', {
      localStorage: {
        getItem: vi.fn((key: string) => (key === 'debug-plugin' ? '1' : null))
      }
    });

    const app = {
      loadLocalStorage: vi.fn(() => null)
    };

    expect(detectObsidianDebugMode(app as never)).toBe(true);
  });

  it('scans localStorage for truthy debug-like keys when the canonical keys are absent', () => {
    vi.stubGlobal('window', {
      localStorage: {
        length: 1,
        key: vi.fn((index: number) => (index === 0 ? 'obsidian-developer-console' : null)),
        getItem: vi.fn((key: string) => (key === 'obsidian-developer-console' ? 'true' : null))
      }
    });

    const app = {
      loadLocalStorage: vi.fn(() => null)
    };

    expect(detectObsidianDebugMode(app as never)).toBe(true);
  });

  it('returns false when no debug flags are present', () => {
    const app = {
      loadLocalStorage: vi.fn(() => null)
    };

    expect(detectObsidianDebugMode(app as never)).toBe(false);
  });
});
