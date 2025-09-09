import { AcceptLanguageResolver, I18nOptions } from 'nestjs-i18n';

export function buildI18nConfig(path: string): I18nOptions {
  return {
    fallbackLanguage: process.env.FALLBACK_LANGUAGE || 'en',
    loaderOptions: {
      path,
      pathPattern: '**/*.json',
      watch: true,
    },
    resolvers: [new AcceptLanguageResolver()],
  };
}
