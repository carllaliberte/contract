import { beforeEach, describe, expect, it, vi } from "vitest";
import { resolveProviderFor, listActiveProviders } from "./agentBus";

vi.mock("../lib/api/generateScript", () => ({
  postGenerateScript: vi.fn(async () => ({
    script: "HOOK: generated",
    titles: ["Title A", "Title B", "Title C"],
    description: "Caption",
    hashtags: ["#creatorflow"],
    hooks: ["H1", "H2", "H3"],
    usage: {
      plan: "free",
      short: { count: 1, limit: 8, remaining: 7 },
      long: { count: 0, limit: 2, remaining: 2 },
    },
    model: "grok-4.5",
  })),
}));

const idea = {
  id: "idea-1",
  title: "Title",
  description: "Desc",
  status: "idea" as const,
  priority: "medium" as const,
  platform: "youtube" as const,
  updatedAt: "2026-01-01T00:00:00Z",
  thumbnail: "https://example.com/t.jpg",
};

describe("agentBus", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("lists active providers", () => {
    expect(listActiveProviders()).toEqual(["tally", "grok"]);
  });

  it("dispatches script generation via grok", async () => {
    const { agentBus } = await import("./agentBus");
    const result = await agentBus.dispatchScriptGenerate({
      idea,
      language: "fr",
      options: { format: "short" },
    });
    expect(result.provider).toBe("grok");
    expect(result.pack.script).toContain("HOOK");
    expect(result.pack.titles).toEqual(["Title A", "Title B", "Title C"]);
    expect(result.pack.hooks).toEqual(["H1", "H2", "H3"]);
    expect(result.pack.hashtags).toEqual(["#creatorflow"]);
  });

  it("resolves grok for script.generate", () => {
    expect(resolveProviderFor("script.generate")).toBe("grok");
  });
});
