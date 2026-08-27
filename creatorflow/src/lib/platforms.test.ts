import { describe, expect, it } from "vitest";
import { labelForPlatform, normalizePlatform } from "./platforms";

describe("normalizePlatform", () => {
  it("maps reels alias to instagram", () => {
    expect(normalizePlatform("reels")).toBe("instagram");
  });

  it("leaves other platforms unchanged", () => {
    expect(normalizePlatform("tiktok")).toBe("tiktok");
    expect(normalizePlatform("instagram")).toBe("instagram");
  });
});

describe("labelForPlatform", () => {
  it("labels reels and instagram as Instagram", () => {
    expect(labelForPlatform("reels")).toBe("Instagram");
    expect(labelForPlatform("instagram")).toBe("Instagram");
  });
});
