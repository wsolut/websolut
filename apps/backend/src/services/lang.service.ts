import { I18nService } from 'nestjs-i18n';
import { TranslationMissingError } from '../entities';

function missingTranslation(
  translation: string | undefined,
  key: string,
): boolean {
  return translation === undefined || translation === key;
}

export class LangService {
  i18nService: I18nService;
  namespace: string;
  fallbackTo: string = 'common';
  raiseOnMissingTranslations: boolean = false;

  constructor(
    i18nService: I18nService,
    namespace: string,
    raiseOnMissingTranslations?: boolean,
  ) {
    this.i18nService = i18nService;
    this.namespace = namespace;
    if (raiseOnMissingTranslations !== undefined) {
      this.raiseOnMissingTranslations = raiseOnMissingTranslations;
    }
  }

  t(key: string, args?: Record<string, unknown>): string {
    args = args ? { args } : {};

    const relativeKey = key.startsWith('.');
    const fullKey = relativeKey ? `${this.namespace}${key}` : key;
    const fallbackKey = `${this.fallbackTo}${key}`;

    let translation: string | undefined = this.i18nService.t(fullKey, args);

    if (missingTranslation(translation, fullKey)) {
      if (relativeKey && fullKey !== fallbackKey) {
        translation = this.i18nService.t(fallbackKey, args);

        if (missingTranslation(translation, fallbackKey)) {
          this.throwError([fullKey, fallbackKey]);
        }
      } else {
        this.throwError([fullKey]);
      }
    }

    return translation as string;
  }

  private throwError(keys: string[]) {
    if (!this.raiseOnMissingTranslations) return;

    throw new TranslationMissingError(
      `Could not found translation value for: ${keys.join(', ')}.`,
    );
  }
}
