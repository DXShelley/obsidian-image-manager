import { vi } from 'vitest';

export function mockApp() {
  return {
    vault: {
      getFiles: vi.fn(() => [])
    }
  };
}

export function mockFile(overrides = {}) {
  return {
    path: 'notes/test.md',
    name: 'test.md',
    basename: 'test',
    extension: 'md',
    ...overrides
  };
}
