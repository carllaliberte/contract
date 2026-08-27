import { describe, expect, it } from "vitest";
import type { Idea } from "../data/demo";
import {
  buildSharePackText,
  SHARE_DESTINATIONS,
  sharePackHasContent,
} from "./sharePack";

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

  it("builds an Instagram caption from hook, caption, and hashtags", () => {
    const idea: Idea = {
      ...sampleIdea,
      packHooks: ["Stop scrolling."],
      packCaption: "Five cuts that kill retention.",
      packHashtags: ["reels", "#editing"],
    };
    expect(buildSharePackText(idea, "instagram")).toBe(
      "Stop scrolling.\n\nFive cuts that kill retention.\n\n#reels #editing",
    );
  });

  it("keeps X under 280 characters", () => {
    const idea: Idea = {
      ...sampleIdea,
      packHooks: ["A".repeat(400)],
      packHashtags: ["toolong"],
    };
    const text = buildSharePackText(idea, "x");
    expect(text.length).toBeLessThanOrEqual(280);
    expect(text.endsWith("…")).toBe(true);
  });
});

describe("sharePackHasContent", () => {
  it("accepts pack-only ideas", () => {
    const idea = {
      ...sampleIdea,
      script: undefined,
      description: "",
      packCaption: "Ready caption",
    };
    expect(sharePackHasContent(idea)).toBe(true);
  });
});

describe("SHARE_DESTINATIONS", () => {
  it("exposes X, Instagram, and TikTok only", () => {
    expect(SHARE_DESTINATIONS).toEqual(["x", "instagram", "tiktok"]);
  });
});
