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

  it("builds TikTok FR-CA structured prompt", () => {
    const { system, user } = buildScriptPrompt({
      title: "Hook viral",
      description: "Une idée simple",
      platform: "tiktok",
      language: "fr",
      mode: "generate",
    });
    expect(system).toContain("scénariste TikTok / Shorts (FR-CA)");
    expect(system).toContain("pattern interrupt");
    expect(user).toContain("Titre: Hook viral");
    expect(user).toContain("HOOK (0–3s)");
    expect(user).toContain("SCÈNE 1 (3–10s)");
    expect(user).toContain("SCÈNE 2 (10–25s)");
    expect(user).toContain("SCÈNE 3 (25–40s)");
    expect(user).toContain("CTA (dernières 5s)");
    expect(user).toContain("35–50 secondes");
    expect(user).toContain("dans cette vidéo on va parler de");
  });

  it("includes existing script for TikTok FR improve mode", () => {
    const { user } = buildScriptPrompt({
      title: "Twist",
      description: "Desc",
      platform: "tiktok",
      language: "fr",
      mode: "improve",
      existingScript: "Script TikTok existant",
    });
    expect(user).toContain("scroll-stopper");
    expect(user).toContain("Script TikTok existant");
    expect(user).toContain("SCÈNE 2");
  });

  it("builds Reels FR-CA structured prompt", () => {
    const { system, user } = buildScriptPrompt({
      title: "Reel esthétique",
      description: "Une idée visuelle",
      platform: "reels",
      language: "fr",
      mode: "generate",
    });
    expect(system).toContain("scénariste Instagram Reels (FR-CA)");
    expect(system).toContain("Esthétique + clarté");
    expect(user).toContain("Titre: Reel esthétique");
    expect(user).toContain("HOOK VISUEL + TEXTE (0–3s)");
    expect(user).toContain("DÉROULÉ:");
    expect(user).toContain("TEXTE À L’ÉCRAN:");
    expect(user).toContain("AUDIO:");
    expect(user).toContain("CTA:");
    expect(user).toContain("20–40 secondes");
    expect(user).toContain("vertical 9:16");
    expect(user).toContain("sans le son");
  });

  it("includes existing script for Reels FR improve mode", () => {
    const { user } = buildScriptPrompt({
      title: "Beat",
      description: "Desc",
      platform: "reels",
      language: "fr",
      mode: "improve",
      existingScript: "Script Reels existant",
    });
    expect(user).toContain("hook visuel");
    expect(user).toContain("Script Reels existant");
    expect(user).toContain("DÉROULÉ:");
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

  it("returns scene-based structure for TikTok FR", () => {
    const script = buildMockScript({
      title: "Stop le scroll",
      description: "Setup rapide",
      platform: "tiktok",
      language: "fr",
      mode: "generate",
    });
    expect(script).toMatch(/^HOOK \(0–3s\)/);
    expect(script).toContain("SCÈNE 1 (3–10s)");
    expect(script).toContain("SCÈNE 2 (10–25s)");
    expect(script).toContain("SCÈNE 3 (25–40s)");
    expect(script).toContain("CTA (dernières 5s)");
  });

  it("returns beat-based structure for Reels FR", () => {
    const script = buildMockScript({
      title: "Hook visuel",
      description: "Plan serré",
      platform: "reels",
      language: "fr",
      mode: "generate",
    });
    expect(script).toMatch(/^HOOK VISUEL \+ TEXTE/);
    expect(script).toContain("DÉROULÉ:");
    expect(script).toContain("TEXTE À L'ÉCRAN:");
    expect(script).toContain("AUDIO:");
    expect(script).toContain("CTA:");
  });
});
