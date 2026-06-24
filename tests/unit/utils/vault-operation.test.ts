import { describe, expect, it, vi } from 'vitest';
import { confirmVaultScopeOperation } from '@/utils/vault-operation';

const { confirmRiskAction } = vi.hoisted(() => ({
  confirmRiskAction: vi.fn(async () => true)
}));

vi.mock('@/ui/modals/risk-confirm-modal', () => ({
  confirmRiskAction
}));

describe('confirmVaultScopeOperation', () => {
  it('prompts before running a vault-scoped operation', async () => {
    const app = {};

    const confirmed = await confirmVaultScopeOperation(app as never, '整库格式转换');

    expect(confirmed).toBe(true);
    expect(confirmRiskAction).toHaveBeenCalledWith(app, {
      title: '确认整库操作',
      message: '整库格式转换会处理整个库中的图片或笔记，可能产生大范围修改。是否继续？',
      confirmText: '继续整库操作',
      cancelText: '取消'
    });
  });
});
