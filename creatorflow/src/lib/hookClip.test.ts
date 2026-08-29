import { describe, expect, it } from "vitest";
import { pickClipMimeType } from "./hookClip";

describe("pickClipMimeType", () => {
  it("prefers mp4 when the browser can record it", () => {
    expect(pickClipMimeType((type) => type.startsWith("video/mp4"))).toBe(
      "video/mp4;codecs=avc1.42E01E",
    );
  });

  it("falls back to webm when mp4 is missing", () => {
    expect(pickClipMimeType((type) => type === "video/webm")).toBe("video/webm");
  });

  it("returns empty when nothing is supported", () => {
    expect(pickClipMimeType(() => false)).toBe("");
  });
});
