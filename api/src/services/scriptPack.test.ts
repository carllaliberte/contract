import { describe, expect, it } from "vitest";
import {
  grokNotConfiguredCode,
  isGrokNotConfiguredMessage,
  normalizeHashtag,
  parseScriptPack,
} from "./scriptPack.js";

describe("parseScriptPack", () => {
  it("parses a JSON pack", () => {
    const pack = parseScriptPack(
      JSON.stringify({
        script: "HOOK: hello",
        titles: ["A", "B", "C", "ignored"],
        description: "Caption",
        hashtags: ["creatorflow", "#tiktok", ""],
        hooks: ["H1", "H2", "H3"],
      }),
    );
    expect(pack.script).toBe("HOOK: hello");
    expect(pack.titles).toEqual(["A", "B", "C"]);
    expect(pack.description).toBe("Caption");
    expect(pack.hashtags).toEqual(["#creatorflow", "#tiktok"]);
    expect(pack.hooks).toEqual(["H1", "H2", "H3"]);
  });

  it("unwraps markdown fences", () => {
    const pack = parseScriptPack(
      '```json\n{"script":"Spoken","titles":["T"],"hooks":["H"]}\n```',
    );
    expect(pack.script).toBe("Spoken");
    expect(pack.titles).toEqual(["T"]);
    expect(pack.hooks).toEqual(["H"]);
  });

  it("falls back to raw script when JSON is missing", () => {
    const pack = parseScriptPack("HOOK: just a script");
    expect(pack.script).toBe("HOOK: just a script");
    expect(pack.titles).toEqual([]);
    expect(pack.hooks).toEqual([]);
  });
});

describe("normalizeHashtag", () => {
  it("prefixes a single hash", () => {
    expect(normalizeHashtag("##foo bar")).toBe("#foobar");
  });
});

describe("grok not configured", () => {
  it("maps both OpenAI and xAI missing-key messages", () => {
    expect(isGrokNotConfiguredMessage("OPENAI_API_KEY is not configured")).toBe(
      true,
    );
    expect(isGrokNotConfiguredMessage("XAI_API_KEY is not configured")).toBe(
      true,
    );
    expect(grokNotConfiguredCode("XAI_API_KEY is not configured")).toBe(
      "GROK_NOT_CONFIGURED",
    );
    expect(isGrokNotConfiguredMessage("rate limit")).toBe(false);
  });
});
