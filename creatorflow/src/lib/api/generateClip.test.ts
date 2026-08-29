import { describe, expect, it } from "vitest";
import { clampClipDuration, clipRequestKey } from "./generateClip";

describe("clampClipDuration", () => {
  it("keeps the clip at 6s or 15s", () => {
    expect(clampClipDuration(1)).toBe(6);
    expect(clampClipDuration(6)).toBe(6);
    expect(clampClipDuration(10)).toBe(10);
    expect(clampClipDuration(15)).toBe(15);
    expect(clampClipDuration(90)).toBe(15);
  });
});

describe("clipRequestKey", () => {
  it("dedupes the same hook, script, and length", () => {
    expect(clipRequestKey("  One tap.  ", 6, "Publish")).toBe(
      clipRequestKey("One tap.", 6, "Publish"),
    );
    expect(clipRequestKey("One tap.", 6, "Publish")).not.toBe(
      clipRequestKey("One tap.", 15, "Publish"),
    );
  });
});
