import { describe, expect, it } from "vitest";
import {
  countByStatus,
  demoIdeas,
  exampleGallery,
  getNextUp,
  showcaseImages,
} from "./demo";

describe("demoIdeas", () => {
  it("contains six presentation-ready ideas", () => {
    expect(demoIdeas.length).toBe(6);
    expect(demoIdeas.every((idea) => idea.title && idea.thumbnail)).toBe(true);
  });

  it("covers every pipeline status", () => {
    const statuses = new Set(demoIdeas.map((idea) => idea.status));
    expect(statuses.has("idea")).toBe(true);
    expect(statuses.has("script")).toBe(true);
    expect(statuses.has("production")).toBe(true);
    expect(statuses.has("ready")).toBe(true);
    expect(statuses.has("published")).toBe(true);
  });
});

describe("getNextUp", () => {
  it("returns the highest-priority active idea", () => {
    const next = getNextUp(demoIdeas);
    expect(next?.id).toBe("4");
    expect(next?.status).toBe("ready");
  });

  it("returns null when everything is published", () => {
    const published = demoIdeas.map((idea) => ({ ...idea, status: "published" as const }));
    expect(getNextUp(published)).toBeNull();
  });
});

describe("countByStatus", () => {
  it("aggregates pipeline counts", () => {
    const counts = countByStatus(demoIdeas);
    expect(counts.idea).toBe(1);
    expect(counts.script).toBe(2);
    expect(counts.production).toBe(1);
    expect(counts.ready).toBe(1);
    expect(counts.published).toBe(1);
  });
});

describe("landing assets", () => {
  it("exports gallery and showcase metadata", () => {
    expect(exampleGallery.length).toBe(4);
    expect(showcaseImages.length).toBe(3);
  });
});
