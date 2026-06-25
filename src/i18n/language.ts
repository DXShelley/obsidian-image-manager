export const SUPPORTED_UI_LANGUAGES = ['zh-CN', 'en'] as const;

export type UiLanguage = (typeof SUPPORTED_UI_LANGUAGES)[number];

export const DEFAULT_UI_LANGUAGE: UiLanguage = 'zh-CN';

const UI_LANGUAGE_LABELS: Readonly<Record<UiLanguage, string>> = {
  'zh-CN': '简体中文',
  en: 'English'
};

export function getUiLanguageOptions(): Readonly<Record<UiLanguage, string>> {
  return UI_LANGUAGE_LABELS;
}

export function isUiLanguage(value: unknown): value is UiLanguage {
  return typeof value === 'string' && SUPPORTED_UI_LANGUAGES.includes(value as UiLanguage);
}

export function resolveUiLanguage(value: unknown): UiLanguage {
  return isUiLanguage(value) ? value : DEFAULT_UI_LANGUAGE;
}
