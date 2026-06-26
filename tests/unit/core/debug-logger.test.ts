import { afterEach, describe, expect, it, vi } from 'vitest';
import { DebugLogger } from '@/core/debug/debug-logger';

describe('DebugLogger', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('does not write detailed logs while disabled', () => {
    const consoleLog = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    const consoleInfo = vi.spyOn(console, 'info').mockImplementation(() => undefined);
    const logger = new DebugLogger(() => false);

    logger.debug('Skipped detail');

    expect(consoleLog).not.toHaveBeenCalled();
    expect(consoleInfo).not.toHaveBeenCalled();
  });

  it('writes prefixed logs when enabled', () => {
    const consoleLog = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    vi.spyOn(console, 'info').mockImplementation(() => undefined);
    const logger = new DebugLogger(() => true);

    logger.debug('Command started', { commandId: 'test-command' });

    expect(consoleLog).toHaveBeenCalledWith('[Note Image Manager] Command started', {
      commandId: 'test-command'
    });
  });

  it('refreshes when the setting changes', () => {
    let enabled = false;
    const consoleInfo = vi.spyOn(console, 'info').mockImplementation(() => undefined);
    const logger = new DebugLogger(() => enabled);

    expect(logger.refreshMode('initial')).toBe(false);
    enabled = true;
    expect(logger.refreshMode('settings-update')).toBe(true);

    expect(consoleInfo).toHaveBeenCalledWith('[Note Image Manager] Debug logging enabled', {
      reason: 'settings-update',
      previous: false
    });
  });

  it('writes errors as direct console arguments so stacks are visible', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    vi.spyOn(console, 'info').mockImplementation(() => undefined);
    const logger = new DebugLogger(() => true);
    const error = new Error('boom');
    const payload = { commandId: 'test-command' };

    logger.error('Command failed', error, payload);

    expect(consoleError).toHaveBeenCalledWith('[Note Image Manager] Command failed', error, payload);
  });
});
