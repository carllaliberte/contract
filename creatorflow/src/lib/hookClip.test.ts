import { describe, expect, it } from "vitest";
import {
  CLIP_ENCODER,
  clipRecorderOptions,
  extractClipBeats,
  lookFromPrompt,
  pickClipMimeType,
} from "./hookClip";

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
  });
});

describe("clipRecorderOptions", () => {
  it("asks MediaRecorder for 1 Mbps H.264 first", () => {
    const [first] = clipRecorderOptions("video/mp4;codecs=avc1.42E01E");
    expect(first.mimeType).toBe("video/mp4;codecs=avc1.42E01E");
    expect(first.videoBitsPerSecond).toBe(1_000_000);
  });
});

describe("extractClipBeats", () => {
  it("keeps the action lines and drops camera boilerplate", () => {
    const beats = extractClipBeats(
      "ClapShot — one idea becomes one clip",
      [
        "Photoreal cinematic VIDEO, vertical 9:16, 15 seconds, 24fps.",
        "0.0–1.2s: A phone lights a tired face.",
        "4.5–8.5s: The mess collapses into a single stack.",
        "Forbidden: freeze-frame, slideshow, on-screen text.",
        "Subject: ClapShot ships to X.",
      ].join("\n"),
    );
    expect(beats.some((beat) => /tired face/i.test(beat))).toBe(true);
    expect(beats.some((beat) => /single stack/i.test(beat))).toBe(true);
    expect(beats.every((beat) => !/Photoreal|Forbidden/i.test(beat))).toBe(true);
  });
});

describe("lookFromPrompt", () => {
  it("does not reuse the same look for different prompts", () => {
    const night = lookFromPrompt("A phone lights a tired face", "dark apartment at 6:14 a.m.");
    const desk = lookFromPrompt("30 idées par semaine", "notebook pipeline on the desk");
    expect(night.label).toBe("CLAPSHOT  NIGHT");
    expect(desk.label).toBe("CLAPSHOT  DESK");
    expect(night.accent).not.toEqual(desk.accent);
    expect(night.bg).not.toBe(desk.bg);
  });
});
