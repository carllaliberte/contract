import { describe, expect, it } from "vitest";
import type { Idea } from "../data/demo";
import { buildApplyPackPatch } from "./applyPack";

const baseIdea: Idea = {
  id: "1",
  title: "Test",
  description: "Desc",
  status: "idea",
  priority: "medium",
  platform: "youtube",
  updatedAt: "2026-01-01T00:00:00Z",
  thumbnail: "https://example.com/t.jpg",
};

describe("buildApplyPackPatch", () => {
  it("writes script and advances from idea to script", () => {
    const patch = buildApplyPackPatch(baseIdea, {
      platform: "youtube",
      language: "fr",
      script: "HOOK: test",
    });
    expect(patch.script).toBe("HOOK: test");
    expect(patch.status).toBe("script");
  });

  it("keeps status when already in production", () => {
    const patch = buildApplyPackPatch(
      { ...baseIdea, status: "production" },
      { platform: "youtube", language: "fr", script: "Updated" },
      { advanceFromIdea: true },
    );
    expect(patch.status).toBe("production");
  });

  it("stores pack metadata when provided", () => {
    const patch = buildApplyPackPatch(baseIdea, {
      platform: "youtube",
      language: "fr",
      script: "Script",
      titles: ["T1", "T2"],
      hashtags: ["#cf"],
      description: "Caption",
      hooks: ["H1", "H2", "H3"],
    });
    expect(patch.packTitles).toEqual(["T1", "T2"]);
    expect(patch.packHashtags).toEqual(["#cf"]);
    expect(patch.packCaption).toBe("Caption");
    expect(patch.packHooks).toEqual(["H1", "H2", "H3"]);
  });
});
