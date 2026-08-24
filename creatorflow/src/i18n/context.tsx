import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { t, type Locale } from "./translations";

type I18nContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  tr: (key: string, vars?: Record<string, string>) => string;
};

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>(() => {
    const saved = localStorage.getItem("cf-locale");
    if (saved === "fr" || saved === "en") return saved;
    return navigator.language.startsWith("fr") ? "fr" : "en";
  });

  const handleSetLocale = useCallback((next: Locale) => {
    setLocale(next);
    localStorage.setItem("cf-locale", next);
    document.documentElement.lang = next;
  }, []);

  const tr = useCallback(
    (key: string, vars?: Record<string, string>) => t(locale, key, vars),
    [locale],
  );

  const value = useMemo(
    () => ({ locale, setLocale: handleSetLocale, tr }),
    [locale, handleSetLocale, tr],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}
