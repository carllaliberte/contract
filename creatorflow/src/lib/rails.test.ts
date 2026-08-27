import { describe, expect, it, vi } from "vitest";
import { resolveAgentProvider, isWeb3RailAvailable, isQuantumRailActive } from "./rails";

vi.mock("./platform", () => ({
  isNativeIos: vi.fn(() => false),
}));

describe("rails", () => {
  it("routes script generation to openai by default", () => {
    expect(resolveAgentProvider("script.generate")).toBe("openai");
  });

  it("routes TTS to tally by default", () => {
    expect(resolveAgentProvider("tts.speak")).toBe("tally");
  });

  it("marks planned providers unavailable", () => {
    expect(resolveAgentProvider("script.generate", "grok")).toBeNull();
  });

  it("enables web3 rail on web", () => {
    expect(isWeb3RailAvailable()).toBe(true);
    expect(isQuantumRailActive("w3")).toBe(true);
  });

  it("keeps ai rail dormant", () => {
    expect(isQuantumRailActive("ai")).toBe(false);
  });
});
