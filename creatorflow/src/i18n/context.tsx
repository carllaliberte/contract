import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { t } from "./translations";
import {
  DEFAULT_LOCALE,
  isLocale,
  localeOption,
  type Locale,
} from "./locales";

type I18nContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  tr: (key: string, vars?: Record<string, string>) => string;
};

const I18nContext = createContext<I18nContextValue | null>(null);

function readLocaleFromUrl(): Locale | null {
  const lang = new URLSearchParams(window.location.search).get("lang");
  return isLocale(lang) ? lang : null;
}

function readInitialLocale(): Locale {
  const fromUrl = readLocaleFromUrl();
  if (fromUrl) return fromUrl;

  const saved = localStorage.getItem("cf-locale");
  if (isLocale(saved)) return saved;

  return DEFAULT_LOCALE;
}

function syncDocumentLocale(locale: Locale) {
  const option = localeOption(locale);
  document.documentElement.lang = locale;
  document.documentElement.dir = option.dir;
}

function syncLangQueryParam(locale: Locale) {
  const url = new URL(window.location.href);
  url.searchParams.set("lang", locale);
  const query = url.searchParams.toString();
  const nextUrl = `${url.pathname}${query ? `?${query}` : ""}${url.hash}`;
  const currentUrl = `${window.location.pathname}${window.location.search}${window.location.hash}`;
  if (nextUrl !== currentUrl) {
    history.replaceState(null, "", nextUrl);
  }
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>(() => {
    const initial = readInitialLocale();
    syncDocumentLocale(initial);
    return initial;
  });

  useEffect(() => {
    syncDocumentLocale(locale);
    localStorage.setItem("cf-locale", locale);
    syncLangQueryParam(locale);
  }, [locale]);

  const handleSetLocale = useCallback((next: Locale) => {
    setLocale(next);
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
