import { afterEach, describe, expect, it, vi } from "vitest";
import type { Idea } from "../../data/demo";
import { ideaFromApi, ideaToApi, isApiConfigured, resolveApiBase } from "./ideas";

const sampleIdea: Idea = {
  id: "550e8400-e29b-41d4-a716-446655440000",
  title: "X thread idea",
  description: "Short thread",
  status: "production",
  priority: "high",
  platform: "x",
  updatedAt: "2026-08-27T12:00:00.000Z",
  scheduledAt: "2026-08-29",
  script: "HOOK: test",
  thumbnail: "https://example.com/thumb.jpg",
  videoUrl: "https://example.com/video.mp4",
};

describe("ideas API helpers", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("treats empty VITE_API_URL as unconfigured", () => {
    vi.stubEnv("VITE_API_URL", "");
    expect(resolveApiBase()).toBe("");
    expect(isApiConfigured()).toBe(false);
  });

  it("strips a trailing slash from the API origin", () => {
    vi.stubEnv("VITE_API_URL", "https://creatorflow-api.fly.dev/");
    expect(resolveApiBase()).toBe("https://creatorflow-api.fly.dev");
    expect(isApiConfigured()).toBe(true);
  });

  it("round-trips an idea including X / Instagram platforms", () => {
    const mapped = ideaFromApi(ideaToApi(sampleIdea));
    expect(mapped).toEqual(sampleIdea);

    const instagram = ideaFromApi(
      ideaToApi({ ...sampleIdea, platform: "instagram" }),
    );
    expect(instagram?.platform).toBe("instagram");
  });

  it("drops API rows with unsupported status or platform", () => {
    expect(
      ideaFromApi({
        ...ideaToApi(sampleIdea),
        status: "draft",
      }),
    ).toBeNull();
    expect(
      ideaFromApi({
        ...ideaToApi(sampleIdea),
        platform: "facebook",
      }),
    ).toBeNull();
  });
});
