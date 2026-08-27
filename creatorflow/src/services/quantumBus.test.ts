import { beforeEach, describe, expect, it, vi } from "vitest";
import { previewScript, applyContentPack } from "./quantumBus";
import type { Idea } from "../data/demo";

vi.mock("./agentBus", () => ({
  agentBus: {
    dispatchScriptGenerate: vi.fn(async () => ({
      pack: {
        ideaId: "idea-1",
        platform: "youtube",
        language: "fr",
        script: "Preview script",
        source: "generated",
      },
      provider: "openai",
    })),
  },
}));

const idea: Idea = {
  id: "idea-1",
  title: "Title",
  description: "Desc",
  status: "idea",
  priority: "medium",
  platform: "youtube",
  updatedAt: "2026-01-01T00:00:00Z",
  thumbnail: "https://example.com/t.jpg",
};

describe("quantumBus", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("previews script without persisting", async () => {
    const patchIdea = vi.fn();
    const result = await previewScript(
      idea.id,
      { format: "short" },
      {
        getIdea: () => idea,
        patchIdea,
        syncIdeas: vi.fn(),
        isOnline: () => true,
      },
    );
    expect(result?.pack.script).toBe("Preview script");
    expect(patchIdea).not.toHaveBeenCalled();
  });

  it("applies pack to idea", async () => {
    const patchIdea = vi.fn();
    await applyContentPack(
      idea.id,
      {
        platform: "youtube",
        language: "fr",
        script: "Applied",
      },
      {
        getIdea: () => idea,
        patchIdea,
        syncIdeas: vi.fn(),
        isOnline: () => true,
      },
    );
    expect(patchIdea).toHaveBeenCalledWith(
      idea.id,
      expect.objectContaining({ script: "Applied", status: "script" }),
    );
  });
});
