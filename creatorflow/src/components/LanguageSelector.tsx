import { useI18n } from "../i18n/context";
import type { Locale } from "../i18n/translations";

const locales: { value: Locale; labelKey: "lang.en" | "lang.fr" }[] = [
  { value: "en", labelKey: "lang.en" },
  { value: "fr", labelKey: "lang.fr" },
];

export function LanguageSelector() {
  const { locale, setLocale, tr } = useI18n();

  return (
    <div
      className="inline-flex h-11 items-center rounded-lg border border-border bg-card/80 p-1 backdrop-blur-sm"
      role="group"
      aria-label={tr("lang.label")}
    >
      {locales.map((item) => {
        const active = locale === item.value;
        return (
          <button
            key={item.value}
            type="button"
            aria-pressed={active}
            onClick={() => setLocale(item.value)}
            className={`h-9 rounded-md px-2.5 text-xs font-semibold tracking-tight transition-colors sm:px-3 sm:text-sm ${
              active
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {tr(item.labelKey)}
          </button>
        );
      })}
    </div>
  );
}
