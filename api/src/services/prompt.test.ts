import { describe, expect, it } from "vitest";
import { buildScriptPrompt } from "./prompt.js";

describe("buildScriptPrompt", () => {
  it("builds a generate prompt for YouTube in French", () => {
    const { system, user } = buildScriptPrompt({
      title: "Test titre",
      description: "Une description",
      platform: "youtube",
      language: "fr",
      mode: "generate",
    });
    expect(system).toContain("scénariste");
    expect(user).toContain("YouTube");
    expect(user).toContain("Test titre");
  });

  it("builds an improve prompt when mode is improve", () => {
    const { user } = buildScriptPrompt({
      title: "Hook",
      description: "Desc",
      platform: "tiktok",
      language: "en",
      mode: "improve",
      existingScript: "Old script line",
    });
    expect(user).toContain("Improve");
    expect(user).toContain("Old script line");
  });
});
