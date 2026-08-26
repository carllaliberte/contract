import { beforeEach, describe, expect, it } from "vitest";
import {
  aiContext,
  getContext,
  getStyleProfile,
  resetStyleProfile,
  subscribeStyleProfile,
  updateStyleFromPackage,
  updateTtsPreferences,
} from "./aiContext";

const samplePackage = {
  ideaId: "idea-1",
  platform: "youtube" as const,
  language: "fr" as const,
  format: "short" as const,
  script: [
    "HOOK: Ces 5 erreurs font fuir 70% de ton audience.",
    "POINT 1: Transitions trop longues",
    "POINT 2: Audio non normalisé",
    "CTA: Abonne-toi pour la checklist complète.",
  ].join("\n"),
  titles: ["5 erreurs de montage"],
  description: "Analyse concrète avec avant/après.",
  hashtags: ["#montage", "#youtube"],
  source: "generated" as const,
};

describe("aiContext service", () => {
  beforeEach(() => {
    localStorage.clear();
    resetStyleProfile();
  });

  it("returns a default style profile", () => {
    const profile = getStyleProfile();
    expect(profile.version).toBe(1);
    expect(profile.sampleCount).toBe(0);
    expect(profile.tts.voiceId).toBe("alloy");
    expect(profile.tts.speed).toBe(1);
  });

  it("learns style from a content package", () => {
    const updated = updateStyleFromPackage(samplePackage);
    expect(updated.sampleCount).toBe(1);
    expect(updated.hookPatterns.length).toBeGreaterThan(0);
    expect(updated.ctaPatterns.length).toBeGreaterThan(0);
    expect(updated.vocabulary).toContain("erreurs");
    expect(updated.memory).toHaveLength(1);
    expect(updated.memory[0].excerpt).toContain("70%");
  });

  it("builds an AI context with style prompt and memory excerpts", () => {
    updateStyleFromPackage(samplePackage);
    const context = getContext({
      platform: "youtube",
      language: "fr",
      includeMemory: true,
    });

    expect(context.stylePrompt).toContain("Style du créateur");
    expect(context.language).toBe("fr");
    expect(context.platform).toBe("youtube");
    expect(context.tts.voiceId).toBe("alloy");
    expect(context.memoryExcerpts.length).toBeGreaterThan(0);
  });

  it("filters memory excerpts by platform", () => {
    updateStyleFromPackage(samplePackage);
    updateStyleFromPackage({
      ...samplePackage,
      platform: "tiktok",
      script: "HOOK: Stop le scroll maintenant.\nCTA: Suis-moi.",
    });

    const youtubeContext = getContext({ platform: "youtube", memoryLimit: 5 });
    expect(youtubeContext.memoryExcerpts.every((e) => e.includes("70%"))).toBe(true);
  });

  it("updates TTS preferences independently", () => {
    const updated = updateTtsPreferences({ voiceId: "nova", speed: 1.1 });
    expect(updated.tts).toEqual({ voiceId: "nova", speed: 1.1 });
    expect(getContext().tts).toEqual({ voiceId: "nova", speed: 1.1 });
  });

  it("notifies subscribers when the profile changes", () => {
    let calls = 0;
    const unsubscribe = subscribeStyleProfile(() => {
      calls += 1;
    });

    updateStyleFromPackage(samplePackage);
    expect(calls).toBe(1);

    unsubscribe();
    updateStyleFromPackage(samplePackage);
    expect(calls).toBe(1);
  });

  it("exposes a singleton-style API", () => {
    aiContext.updateStyleFromPackage(samplePackage);
    expect(aiContext.getStyleProfile().sampleCount).toBe(1);
    expect(aiContext.getContext().stylePrompt.length).toBeGreaterThan(0);
  });
});
