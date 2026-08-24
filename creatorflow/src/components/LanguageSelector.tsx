import { Globe } from "lucide-react";
import { useI18n } from "../i18n/context";
import type { Locale } from "../i18n/translations";

export function LanguageSelector() {
  const { locale, setLocale, tr } = useI18n();

  return (
    <div className="relative">
      <label htmlFor="lang-select" className="sr-only">
        {tr("lang.label")}
      </label>
      <div className="inline-flex h-11 items-center gap-2 rounded-lg border border-border bg-card/80 px-3 text-sm font-medium backdrop-blur-sm">
        <Globe className="size-4 text-muted-foreground" aria-hidden />
        <select
          id="lang-select"
          value={locale}
          onChange={(e) => setLocale(e.target.value as Locale)}
          className="cursor-pointer bg-transparent text-foreground outline-none"
        >
          <option value="fr">{tr("lang.fr")}</option>
          <option value="en">{tr("lang.en")}</option>
        </select>
      </div>
    </div>
  );
}
