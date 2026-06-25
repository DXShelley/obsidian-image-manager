import { getLocalizedCommandName, getNoticeCopy } from '@/i18n';
import { Notice } from 'obsidian';
import { resolveUiLanguage, type ImageManagerFeatureContext } from '@/types/index';

interface CommandLogContext {
  readonly commandId: string;
  readonly commandName: string;
  readonly payload?: Readonly<Record<string, unknown>>;
}

export async function executeLoggedCommand(
  context: ImageManagerFeatureContext,
  meta: CommandLogContext,
  run: () => Promise<void>
): Promise<void> {
  context.services.logger.refreshMode(`command:${meta.commandId}`);
  context.services.logger.debug('Command started', {
    commandId: meta.commandId,
    commandName: meta.commandName,
    ...(meta.payload ?? {})
  });

  try {
    await run();
    context.services.logger.debug('Command completed', {
      commandId: meta.commandId,
      commandName: meta.commandName,
      ...(meta.payload ?? {})
    });
  } catch (error) {
    const language = resolveUiLanguage(context.services.settings.getSettings().uiLanguage);
    const commandName = getLocalizedCommandName(meta.commandId, language) ?? meta.commandName;
    console.error(`Image Manager command failed: ${meta.commandName}`, error);
    context.services.logger.error('Command failed', error, {
      commandId: meta.commandId,
      commandName: meta.commandName,
      ...(meta.payload ?? {})
    });
    new Notice(getNoticeCopy(language).commandFailed(commandName));
  }
}

export function logSkippedCommand(
  context: ImageManagerFeatureContext,
  meta: CommandLogContext & {
    readonly reason: string;
  }
): void {
  context.services.logger.refreshMode(`command:${meta.commandId}:skipped`);
  context.services.logger.warn('Command skipped', {
    commandId: meta.commandId,
    commandName: meta.commandName,
    reason: meta.reason,
    ...(meta.payload ?? {})
  });
}
