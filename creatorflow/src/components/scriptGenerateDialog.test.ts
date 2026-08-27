import { describe, expect, it } from "vitest";
import { parseUserSource } from "./ScriptGenerateDialog";

describe("parseUserSource", () => {
  it("returns empty for blank input", () => {
    expect(parseUserSource("  ")).toEqual({});
  });

  it("treats a lone URL as sourceUrl", () => {
    expect(parseUserSource("https://en.wikipedia.org/wiki/Quebec")).toEqual({
      sourceUrl: "https://en.wikipedia.org/wiki/Quebec",
    });
  });

  it("splits URL + extra text", () => {
    expect(parseUserSource("https://example.com/a\nNotes perso")).toEqual({
      sourceUrl: "https://example.com/a",
      sourceText: "Notes perso",
    });
  });

  it("treats free text as sourceText", () => {
    expect(parseUserSource("Un article copié")).toEqual({
      sourceText: "Un article copié",
    });
  });
});
