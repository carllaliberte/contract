import { afterEach, describe, expect, it, vi } from "vitest";
import { isNativePlatform } from "../lib/platform";
import { isWeb3Enabled, parseAgentIds } from "./flags";

vi.mock("../lib/platform", () => ({
  isNativePlatform: vi.fn(() => false),
}));

describe("parseAgentIds", () => {
  it("defaults to tally,openai", () => {
    expect(parseAgentIds(undefined)).toEqual(["tally", "openai"]);
    expect(parseAgentIds("")).toEqual(["tally", "openai"]);
  });

  it("parses a comma list and drops unknowns", () => {
    expect(parseAgentIds("tally, grok, nope, openai")).toEqual(["tally", "grok", "openai"]);
  });
});

describe("isWeb3Enabled", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.mocked(isNativePlatform).mockReturnValue(false);
  });

  it("is false by default", () => {
    expect(isWeb3Enabled()).toBe(false);
  });

  it("is true on web when flagged", () => {
    vi.mocked(isNativePlatform).mockReturnValue(false);
    vi.stubEnv("VITE_AGENT_WEB3", "true");
    expect(isWeb3Enabled()).toBe(true);
  });

  it("is forced false on native even when flagged", () => {
    vi.mocked(isNativePlatform).mockReturnValue(true);
    vi.stubEnv("VITE_AGENT_WEB3", "true");
    expect(isWeb3Enabled()).toBe(false);
  });
});
