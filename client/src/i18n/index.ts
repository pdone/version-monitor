import { create } from 'zustand';
import en from './locales/en.json';
import zh from './locales/zh.json';

type Locale = 'en' | 'zh';
type Messages = typeof en;

const localeMap: Record<Locale, Messages> = { en, zh };

interface I18nState {
  locale: Locale;
  messages: Messages;
  setLocale: (locale: Locale) => void;
  t: (key: string, params?: Record<string, string>) => string;
}

function getNestedValue(obj: any, path: string): string | undefined {
  return path.split('.').reduce((acc, part) => acc?.[part], obj) as string | undefined;
}

const savedLocale = (localStorage.getItem('locale') as Locale) || 'en';
document.documentElement.lang = savedLocale;

export const useI18nStore = create<I18nState>((set, get) => ({
  locale: savedLocale,
  messages: localeMap[savedLocale],

  setLocale: (locale: Locale) => {
    localStorage.setItem('locale', locale);
    document.documentElement.lang = locale;
    set({ locale, messages: localeMap[locale] });
  },

  t: (key: string, params?: Record<string, string>) => {
    const { messages } = get();
    let value = getNestedValue(messages, key) || key;
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        value = value.replace(`{${k}}`, v);
      });
    }
    return value;
  },
}));

export type { Locale };
