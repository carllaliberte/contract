import { beforeEach, describe, expect, it } from "vitest";
import {
  __resetAiContextForTests,
  buildPromptContext,
  getContext,
  getStyleProfile,
  recordVoicePreference,
  resetStyleMemory,
  setUseStyleMemory,
  updateStyleFromPackage,
} from "./aiContext";

describe("aiContext service", () => {
  beforeEach(async () => {
    await __resetAiContextForTests();
  });

  it("starts with default profile and style memory enabled", async () => {
    const context = await getContext();
    expect(context.useStyleMemory).toBe(true);
    expect(context.styleProfile.preferredTones).toEqual([]);
    expect(context.styleProfile.version).toBe(1);
  });

  it("learns tones, platforms and length from a content package", async () => {
    await updateStyleFromPackage({
      id: "pkg-1",
      platform: "youtube",
      tones: ["éducatif", "calme"],
      script: "Comment structurer une vidéo YouTube avec un hook clair et des étapes simples.",
      length: 1200,
      successful: true,
    });

    const profile = await getStyleProfile();
    expect(profile.preferredTones).toContain("éducatif");
    expect(profile.preferredPlatforms).toContain("youtube");
    expect(profile.averageLengthByPlatform.youtube).toBe(1200);
    expect(profile.recentSuccessfulPackages).toContain("pkg-1");
  });

  it("records voice preferences with usage count", async () => {
    await recordVoicePreference("voice-a", "Alex");
    await recordVoicePreference("voice-a", "Alex");

    const profile = await getStyleProfile();
    expect(profile.preferredVoices["voice-a"].usageCount).toBe(2);
    expect(profile.preferredVoices["voice-a"].voiceName).toBe("Alex");
  });

  it("respects the useStyleMemory toggle for learning and prompts", async () => {
    await setUseStyleMemory(false);
    await updateStyleFromPackage({
      id: "pkg-ignored",
      platform: "reels",
      tones: ["fun"],
      successful: true,
    });

    let profile = await getStyleProfile();
    expect(profile.preferredTones).toEqual([]);

    let prompt = await buildPromptContext();
    expect(prompt.enabled).toBe(false);
    expect(prompt.text).toBe("");

    await setUseStyleMemory(true);
    await updateStyleFromPackage({
      id: "pkg-2",
      platform: "reels",
      tones: ["fun"],
      successful: true,
    });

    profile = await getStyleProfile();
    expect(profile.preferredTones).toContain("fun");

    prompt = await buildPromptContext();
    expect(prompt.enabled).toBe(true);
    expect(prompt.text).toContain("fun");
  });

  it("resets learned profile while keeping toggle state", async () => {
    await updateStyleFromPackage({
      id: "pkg-3",
      platform: "tiktok",
      tones: ["énergique"],
      successful: true,
    });
    await setUseStyleMemory(false);
    await resetStyleMemory();

    const context = await getContext();
    expect(context.useStyleMemory).toBe(false);
    expect(context.styleProfile.preferredTones).toEqual([]);
    expect(context.styleProfile.recentSuccessfulPackages).toEqual([]);
  });
});
