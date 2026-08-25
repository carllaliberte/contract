import { describe, expect, it } from "vitest";
import { buildMockScript, buildScriptPrompt } from "./prompt.js";

describe("buildScriptPrompt", () => {
  it("builds YouTube FR-CA structured prompt", () => {
    const { system, user } = buildScriptPrompt({
      title: "Test titre",
      description: "Une description",
      platform: "youtube",
      language: "fr",
      mode: "generate",
    });
    expect(system).toContain("scénariste YouTube (FR-CA)");
    expect(system).toContain("zéro corporate");
    expect(user).toContain("Titre: Test titre");
    expect(user).toContain("Description: Une description");
    expect(user).toContain("HOOK:");
    expect(user).toContain("CONTEXTE:");
    expect(user).toContain("POINTS:");
    expect(user).toContain("PREUVE / EXEMPLE:");
    expect(user).toContain("CTA:");
    expect(user).toContain("québécoise légère");
    expect(user).toContain("Pas de hashtags");
    expect(user).not.toContain("YouTube");
  });

  it("includes existing script for YouTube FR improve mode", () => {
    const { user } = buildScriptPrompt({
      title: "Mon titre",
      description: "Desc",
      platform: "youtube",
      language: "fr",
      mode: "improve",
      existingScript: "Ancien script",
    });
    expect(user).toContain("Améliore le script actuel");
    expect(user).toContain("Ancien script");
    expect(user).toContain("HOOK:");
  });

  it("builds an improve prompt for TikTok in English", () => {
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

describe("buildMockScript", () => {
  it("returns HOOK/CONTEXTE structure for YouTube FR", () => {
    const script = buildMockScript({
      title: "Test",
      description: "Ma description",
      platform: "youtube",
      language: "fr",
      mode: "generate",
    });
    expect(script).toMatch(/^HOOK:/);
    expect(script).toContain("CONTEXTE:");
    expect(script).toContain("POINTS:");
    expect(script).toContain("PREUVE / EXEMPLE:");
    expect(script).toContain("CTA:");
  });
});
