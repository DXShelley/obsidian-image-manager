import { getUiCopy } from '@/i18n';
import type { App } from 'obsidian';
import type { UiLanguage } from '@/types/index';
import { confirmRiskAction } from '@/ui/modals/risk-confirm-modal';

export async function confirmVaultScopeOperation(app: App, language: UiLanguage, actionName: string): Promise<boolean> {
  const copy = getUiCopy(language).vaultOperation;
  return confirmRiskAction(app, {
    title: copy.title,
    message: copy.message(actionName),
    confirmText: copy.confirmText,
    cancelText: copy.cancelText
  });
}
