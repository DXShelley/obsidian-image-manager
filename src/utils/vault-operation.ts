import type { App } from 'obsidian';
import { confirmRiskAction } from '@/ui/modals/risk-confirm-modal';

export async function confirmVaultScopeOperation(app: App, actionName: string): Promise<boolean> {
  return confirmRiskAction(app, {
    title: '确认整库操作',
    message: `${actionName}会处理整个库中的图片或笔记，可能产生大范围修改。是否继续？`,
    confirmText: '继续整库操作',
    cancelText: '取消'
  });
}
