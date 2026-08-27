import { describe, expect, it } from "vitest";
import type { Idea } from "../data/demo";
import { buildDuplicateIdea } from "./ideaActions";

const sample: Idea = {
  id: "a",
  title: "Test idea",
  description: "Desc",
  status: "ready",
  priority: "high",
  platform: "youtube",
  updatedAt: "2026-08-26T00:00:00Z",
  scheduledAt: "2026-08-28",
  script: "HOOK: hello",
  thumbnail: "https://example.com/thumb.jpg",
  videoUrl: "https://example.com/video.mp4",
};

describe("ideaActions", () => {
  it("builds a duplicate idea reset to idea status", () => {
    const duplicate = buildDuplicateIdea(sample, " (copy)");
    expect(duplicate.title).toBe("Test idea (copy)");
    expect(duplicate.status).toBe("idea");
    expect(duplicate.script).toBe(sample.script);
    expect(duplicate.scheduledAt).toBe(sample.scheduledAt);
    expect(duplicate.videoUrl).toBe(sample.videoUrl);
  });
});
