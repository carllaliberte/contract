import { describe, expect, it } from "vitest";
import type { Idea } from "../../data/demo";
import { ideaFromRow, ideaToRow } from "./supabaseStore";

const sampleIdea: Idea = {
  id: "550e8400-e29b-41d4-a716-446655440000",
  title: "Test idea",
  description: "Description",
  status: "script",
  priority: "high",
  platform: "youtube",
  updatedAt: "2026-08-26T12:00:00.000Z",
  scheduledAt: "2026-08-28",
  script: "HOOK: test",
  thumbnail: "https://example.com/thumb.jpg",
  videoUrl: "https://example.com/video.mp4",
};

describe("supabaseStore row mapping", () => {
  it("maps Idea to database row", () => {
    const row = ideaToRow(sampleIdea, "user-123");
    expect(row).toEqual({
      id: sampleIdea.id,
      user_id: "user-123",
      title: "Test idea",
      description: "Description",
      status: "script",
      priority: "high",
      platform: "youtube",
      updated_at: "2026-08-26T12:00:00.000Z",
      scheduled_at: "2026-08-28",
      script: "HOOK: test",
      thumbnail: "https://example.com/thumb.jpg",
      video_url: "https://example.com/video.mp4",
    });
  });

  it("maps database row to Idea", () => {
    const idea = ideaFromRow({
      id: sampleIdea.id,
      user_id: "user-123",
      title: "Test idea",
      description: "Description",
      status: "script",
      priority: "high",
      platform: "youtube",
      updated_at: "2026-08-26T12:00:00.000Z",
      scheduled_at: "2026-08-28",
      script: "HOOK: test",
      thumbnail: "https://example.com/thumb.jpg",
      video_url: "https://example.com/video.mp4",
    });
    expect(idea).toEqual(sampleIdea);
  });
});
