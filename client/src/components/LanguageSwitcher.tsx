import { useI18nStore, Locale } from '@/i18n';

const localeLabels: Record<Locale, string> = {
  en: 'EN',
  zh: '中',
};

export function LanguageSwitcher() {
  const { locale, setLocale } = useI18nStore();

  return (
    <div className="flex items-center gap-1 rounded-lg border p-1">
      {(Object.keys(localeLabels) as Locale[]).map((loc) => (
        <button
          key={loc}
          onClick={() => setLocale(loc)}
          className={`rounded-md px-2 py-1 text-xs font-medium transition-colors ${
            locale === loc
              ? 'bg-background text-foreground'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          {localeLabels[loc]}
        </button>
      ))}
    </div>
  );
}
