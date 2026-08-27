import { beforeEach, describe, expect, it, vi } from "vitest";
import { resolveProviderFor, listActiveProviders } from "./agentBus";

vi.mock("../lib/api/generateScript", () => ({
  postGenerateScript: vi.fn(async () => ({
    script: "HOOK: generated",
    usage: {
      plan: "free",
      short: { count: 1, limit: 8, remaining: 7 },
      long: { count: 0, limit: 2, remaining: 2 },
    },
    model: "gpt-4o-mini",
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
    expect(listActiveProviders()).toEqual(["tally", "openai"]);
  });

  it("dispatches script generation via openai", async () => {
    const { agentBus } = await import("./agentBus");
    const result = await agentBus.dispatchScriptGenerate({
      idea,
      language: "fr",
      options: { format: "short" },
    });
    expect(result.provider).toBe("openai");
    expect(result.pack.script).toContain("HOOK");
  });

  it("resolves openai for script.generate", () => {
    expect(resolveProviderFor("script.generate")).toBe("openai");
  });
});
