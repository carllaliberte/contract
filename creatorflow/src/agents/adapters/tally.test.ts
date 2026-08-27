import { beforeEach, describe, expect, it } from "vitest";
import { getContext, resetStyleProfile } from "../../services/aiContext";
import type { AgentRunContext } from "../types";
import { tallyAdapter } from "./tally";

function ctx(language: "fr" | "en" = "fr"): AgentRunContext {
  return {
    ...getContext({ language }),
    ideaId: "idea-1",
    prompt: "Routine créateur 60 secondes",
    title: "Routine",
    description: "Storytelling vertical",
  };
}

describe("tally adapter", () => {
  beforeEach(() => {
    localStorage.clear();
    resetStyleProfile();
  });

  it("is a local coach, always available", () => {
    expect(tallyAdapter.id).toBe("tally");
    expect(tallyAdapter.kind).toBe("coach");
    expect(tallyAdapter.cost).toBe("local");
    expect(tallyAdapter.label).toBe("Régie");
    expect(tallyAdapter.available()).toBe(true);
  });

  it("returns short tutoiement copy from AIContext", async () => {
    const result = await tallyAdapter.run(ctx("fr"));
    expect(result.apply).toBe("script");
    expect(result.text.toLowerCase()).toMatch(/tu |reste |applique|plan /);
    expect(result.text.length).toBeLessThan(600);
  });
});
