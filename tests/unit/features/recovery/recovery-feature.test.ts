import { describe, expect, it, vi } from 'vitest';
import { RecoveryFeature } from '@/features/recovery/recovery-feature';
import { DEFAULT_SETTINGS } from '@/types/index';

describe('RecoveryFeature', () => {
  it('reports undo failures through the shared command logger', async () => {
    const feature = new RecoveryFeature();
    const failure = new Error('undo failed');
    const commandCallbacks = new Map<string, () => void>();
    const logger = {
      refreshMode: vi.fn(),
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn()
    };
    vi.spyOn(console, 'error').mockImplementation(() => undefined);

    await feature.register({
      plugin: {
        addCommand: vi.fn((command: { id: string; callback: () => void }) => {
          commandCallbacks.set(command.id, command.callback);
        })
      },
      services: {
        settings: {
          getSettings: vi.fn(() => DEFAULT_SETTINGS)
        },
        recovery: {
          undoLastTransaction: vi.fn(async () => {
            throw failure;
          })
        },
        logger
      }
    } as never);

    commandCallbacks.get('d1-undo-last-image-manager-transaction')?.();

    await vi.waitFor(() => {
      expect(logger.error).toHaveBeenCalledWith(
        'Command failed',
        failure,
        expect.objectContaining({
          commandId: 'd1-undo-last-image-manager-transaction'
        })
      );
    });
  });
});
