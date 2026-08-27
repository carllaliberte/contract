import {
  createContext,
  useCallback,
  useContext,
  useEffect,
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

function readLocaleFromUrl(): Locale | null {
  const lang = new URLSearchParams(window.location.search).get("lang");
  if (lang === "en" || lang === "fr") return lang;
  return null;
}

function readInitialLocale(): Locale {
  const fromUrl = readLocaleFromUrl();
  if (fromUrl) return fromUrl;

  const saved = localStorage.getItem("cf-locale");
  if (saved === "fr" || saved === "en") return saved;

  return "en";
}

function syncDocumentLocale(locale: Locale) {
  document.documentElement.lang = locale;
}

function syncLangQueryParam(locale: Locale) {
  const url = new URL(window.location.href);
  if (locale === "en") {
    url.searchParams.set("lang", "en");
  } else {
    url.searchParams.delete("lang");
  }
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
