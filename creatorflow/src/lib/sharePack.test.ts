import { describe, expect, it } from "vitest";
import type { Idea } from "../data/demo";
import { buildSharePackText, SHARE_DESTINATIONS } from "./sharePack";

const sampleIdea: Idea = {
  id: "1",
  title: "Test title",
  description: "Fallback description",
  status: "ready",
  priority: "medium",
  platform: "instagram",
  updatedAt: "2026-08-26T00:00:00Z",
  script: "HOOK: Hello\nCTA: Follow",
  thumbnail: "https://example.com/thumb.jpg",
};

describe("buildSharePackText", () => {
  it("includes title and script", () => {
    expect(buildSharePackText(sampleIdea)).toBe(
      "Test title\n\nHOOK: Hello\nCTA: Follow",
    );
  });

  it("falls back to description when script is missing", () => {
    const idea = { ...sampleIdea, script: undefined };
    expect(buildSharePackText(idea)).toBe("Test title\n\nFallback description");
  });
});

describe("SHARE_DESTINATIONS", () => {
  it("exposes X, Instagram, TikTok, and copy", () => {
    expect(SHARE_DESTINATIONS).toEqual(["x", "instagram", "tiktok", "copy"]);
  });
});
