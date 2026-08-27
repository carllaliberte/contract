import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { catalogLocales, LOCALES } from "./locales";
import { t } from "./translations";

const catalogDir = join(dirname(fileURLToPath(import.meta.url)), "catalog");

function loadCatalog(id: string): Record<string, string> {
  return JSON.parse(readFileSync(join(catalogDir, `${id}.json`), "utf8")) as Record<
    string,
    string
  >;
}

describe("i18n catalogs", () => {
  const en = loadCatalog("en");
  const keys = Object.keys(en);
  const files = readdirSync(catalogDir).filter((name) => name.endsWith(".json"));
  const ids = files.map((name) => name.replace(/\.json$/, ""));

  it("ships a catalog for every locale mapping", () => {
    expect(ids.sort()).toEqual([...catalogLocales()].sort());
  });

  it("keeps every catalog complete", () => {
    for (const id of ids) {
      const table = loadCatalog(id);
      expect(Object.keys(table).sort(), id).toEqual([...keys].sort());
      for (const key of keys) {
        expect(table[key]?.length, `${id}:${key}`).toBeGreaterThan(0);
      }
    }
  });

  it("keeps Tally hero copy in English and French", () => {
    expect(en["app.heroTitle"]).toBe("4 ideas. 0 shots filmed.");
    expect(en["app.lead"]).toBe("The booth. Not another dashboard.");
    expect(en["login.start"]).toBe("Let’s go.");
    const fr = loadCatalog("fr");
    expect(fr["app.heroTitle"]).toBe("T’as 4 idées. 0 plan tourné.");
    expect(fr["app.lead"]).toBe("La régie. Pas un autre dashboard.");
    expect(fr["login.start"]).toBe("On commence.");
  });

  it("does not put forbidden words in hero strings", () => {
    const forbidden = /friction|synergy|credit card|publish more content/i;
    for (const id of ids) {
      const table = loadCatalog(id);
      expect(table["app.heroTitle"], id).not.toMatch(forbidden);
      expect(table["app.lead"], id).not.toMatch(forbidden);
      expect(table["login.start"], id).not.toMatch(forbidden);
    }
  });

  it("resolves regional variants through the parent catalog", () => {
    expect(t("fr-CA", "login.start")).toBe("On commence.");
    expect(t("es-MX", "lang.label")).toBe(t("es", "lang.label"));
    expect(LOCALES).toHaveLength(41);
  });
});
