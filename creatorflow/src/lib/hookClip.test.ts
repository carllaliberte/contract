import { describe, expect, it } from "vitest";
import { CLIP_ENCODER, clipRecorderOptions, pickClipMimeType } from "./hookClip";

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

describe("CLIP_ENCODER", () => {
  it("keeps a compact 9:16 social profile", () => {
    expect(CLIP_ENCODER.width).toBe(720);
    expect(CLIP_ENCODER.height).toBe(1280);
    expect(CLIP_ENCODER.fps).toBe(24);
    expect(CLIP_ENCODER.videoBitsPerSecond).toBe(1_000_000);
    expect(CLIP_ENCODER.keyframeMs).toBe(1000);
  });
});

describe("clipRecorderOptions", () => {
  it("asks MediaRecorder for 1 Mbps H.264 first", () => {
    const [first] = clipRecorderOptions("video/mp4;codecs=avc1.42E01E");
    expect(first.mimeType).toBe("video/mp4;codecs=avc1.42E01E");
    expect(first.videoBitsPerSecond).toBe(1_000_000);
    expect(first.bitsPerSecond).toBe(1_000_000);
  });

  it("falls back to bitrate-only then mime-only", () => {
    const options = clipRecorderOptions("video/mp4");
    expect(options.some((opt) => opt.mimeType === "video/mp4" && !opt.videoBitsPerSecond)).toBe(
      true,
    );
    expect(options.some((opt) => !opt.mimeType && opt.videoBitsPerSecond === 1_000_000)).toBe(
      true,
    );
  });
});
