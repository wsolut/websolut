import { createI18n } from 'vue-i18n';
import en from '@/locales/en.json';
import ja from '@/locales/ja.json';

type Messages = typeof en;

const messages: Record<string, Messages> = {
  en,
  ja,
};

const lang: string = localStorage.getItem('lang') || 'en';

const i18n = createI18n({
  legacy: false,
  locale: lang,
  fallbackLocale: 'en',
  messages,
});

export default i18n;
