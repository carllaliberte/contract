import { beforeEach, describe, expect, it } from "vitest";
import { LIMITS } from "./limits";
import { canUseAiGeneration, getAiUsage, syncAiUsage } from "./aiUsage";

describe("aiUsage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("starts with the free-plan monthly quota", () => {
    const usage = getAiUsage();
    expect(usage.limit).toBe(LIMITS.free);
    expect(usage.count).toBe(0);
    expect(usage.remaining).toBe(LIMITS.free);
    expect(canUseAiGeneration()).toBe(true);
  });

  it("syncs usage from API snapshot", () => {
    syncAiUsage({ count: 3, limit: LIMITS.pro });
    const usage = getAiUsage();
    expect(usage.count).toBe(3);
    expect(usage.limit).toBe(LIMITS.pro);
    expect(usage.remaining).toBe(LIMITS.pro - 3);
  });

  it("blocks usage after the monthly limit", () => {
    syncAiUsage({ count: LIMITS.free, limit: LIMITS.free });
    expect(canUseAiGeneration()).toBe(false);
    expect(getAiUsage().remaining).toBe(0);
  });
});
