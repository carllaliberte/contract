export type LocaleDir = "ltr" | "rtl";

export type LocaleOption = {
  /** BCP-47 / iOS .lproj id */
  id: string;
  native: string;
  /** Catalog file to load (regional variants share a parent). */
  catalog: string;
  dir: LocaleDir;
};

/** App Store + in-app language list. Default is English (US). */
export const LOCALES = [
  { id: "en", native: "English (US)", catalog: "en", dir: "ltr" },
  { id: "en-GB", native: "English (UK)", catalog: "en", dir: "ltr" },
  { id: "en-CA", native: "English (Canada)", catalog: "en", dir: "ltr" },
  { id: "en-AU", native: "English (Australia)", catalog: "en", dir: "ltr" },
  { id: "fr", native: "Français", catalog: "fr", dir: "ltr" },
  { id: "fr-CA", native: "Français (Canada)", catalog: "fr", dir: "ltr" },
  { id: "es", native: "Español", catalog: "es", dir: "ltr" },
  { id: "es-MX", native: "Español (México)", catalog: "es", dir: "ltr" },
  { id: "pt-BR", native: "Português (Brasil)", catalog: "pt-BR", dir: "ltr" },
  { id: "pt", native: "Português (Portugal)", catalog: "pt", dir: "ltr" },
  { id: "de", native: "Deutsch", catalog: "de", dir: "ltr" },
  { id: "it", native: "Italiano", catalog: "it", dir: "ltr" },
  { id: "nl", native: "Nederlands", catalog: "nl", dir: "ltr" },
  { id: "pl", native: "Polski", catalog: "pl", dir: "ltr" },
  { id: "ru", native: "Русский", catalog: "ru", dir: "ltr" },
  { id: "uk", native: "Українська", catalog: "uk", dir: "ltr" },
  { id: "tr", native: "Türkçe", catalog: "tr", dir: "ltr" },
  { id: "ja", native: "日本語", catalog: "ja", dir: "ltr" },
  { id: "ko", native: "한국어", catalog: "ko", dir: "ltr" },
  { id: "zh-Hans", native: "简体中文", catalog: "zh-Hans", dir: "ltr" },
  { id: "zh-Hant", native: "繁體中文", catalog: "zh-Hant", dir: "ltr" },
  { id: "ar", native: "العربية", catalog: "ar", dir: "rtl" },
  { id: "he", native: "עברית", catalog: "he", dir: "rtl" },
  { id: "hi", native: "हिन्दी", catalog: "hi", dir: "ltr" },
  { id: "bn", native: "বাংলা", catalog: "bn", dir: "ltr" },
  { id: "id", native: "Bahasa Indonesia", catalog: "id", dir: "ltr" },
  { id: "ms", native: "Bahasa Melayu", catalog: "ms", dir: "ltr" },
  { id: "vi", native: "Tiếng Việt", catalog: "vi", dir: "ltr" },
  { id: "th", native: "ไทย", catalog: "th", dir: "ltr" },
  { id: "sv", native: "Svenska", catalog: "sv", dir: "ltr" },
  { id: "da", native: "Dansk", catalog: "da", dir: "ltr" },
  { id: "nb", native: "Norsk", catalog: "nb", dir: "ltr" },
  { id: "fi", native: "Suomi", catalog: "fi", dir: "ltr" },
  { id: "cs", native: "Čeština", catalog: "cs", dir: "ltr" },
  { id: "ro", native: "Română", catalog: "ro", dir: "ltr" },
  { id: "hu", native: "Magyar", catalog: "hu", dir: "ltr" },
  { id: "el", native: "Ελληνικά", catalog: "el", dir: "ltr" },
  { id: "ca", native: "Català", catalog: "ca", dir: "ltr" },
  { id: "hr", native: "Hrvatski", catalog: "hr", dir: "ltr" },
  { id: "sk", native: "Slovenčina", catalog: "sk", dir: "ltr" },
  { id: "sl", native: "Slovenščina", catalog: "sl", dir: "ltr" },
] as const satisfies readonly LocaleOption[];

export type Locale = (typeof LOCALES)[number]["id"];

export const DEFAULT_LOCALE: Locale = "en";

const byId = new Map<string, (typeof LOCALES)[number]>(
  LOCALES.map((item) => [item.id, item]),
);

export function isLocale(value: string | null | undefined): value is Locale {
  return Boolean(value && byId.has(value));
}

export function localeOption(id: Locale): (typeof LOCALES)[number] {
  return byId.get(id) ?? LOCALES[0];
}

export function catalogLocales(): string[] {
  return [...new Set(LOCALES.map((item) => item.catalog))];
}

export function readSavedLocale(): Locale {
  if (typeof window === "undefined") return DEFAULT_LOCALE;
  const saved = window.localStorage.getItem("cf-locale");
  return isLocale(saved) ? saved : DEFAULT_LOCALE;
}
