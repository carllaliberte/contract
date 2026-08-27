import { localeOption, type Locale } from "./locales";

export type { Locale };
export type Translations = Record<string, string>;

const catalogModules = import.meta.glob("./catalog/*.json", {
  eager: true,
  import: "default",
}) as Record<string, Translations>;

function tableFor(locale: Locale): Translations {
  const id = localeOption(locale).catalog;
  return catalogModules[`./catalog/${id}.json`] ?? catalogModules["./catalog/en.json"] ?? {};
}

export function t(
  locale: Locale,
  key: string,
  vars?: Record<string, string>,
): string {
  const fallback = catalogModules["./catalog/en.json"] ?? {};
  let text = tableFor(locale)[key] ?? fallback[key] ?? key;
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      text = text.replace(`{${k}}`, v);
    }
  }
  return text;
}

export function loadedCatalogIds(): string[] {
  return Object.keys(catalogModules)
    .map((path) => path.replace("./catalog/", "").replace(".json", ""))
    .sort();
}
