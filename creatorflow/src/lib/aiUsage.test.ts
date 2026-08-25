import { beforeEach, describe, expect, it } from "vitest";
import { PLAN_LIMITS } from "./plans";
import { canUseAiGeneration, getAiUsage, syncAiUsage } from "./aiUsage";

describe("aiUsage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("starts with the free-plan monthly quotas", () => {
    const usage = getAiUsage();
    expect(usage.plan).toBe("free");
    expect(usage.short.limit).toBe(PLAN_LIMITS.free.short);
    expect(usage.long.limit).toBe(PLAN_LIMITS.free.long);
    expect(usage.short.count).toBe(0);
    expect(canUseAiGeneration("short")).toBe(true);
    expect(canUseAiGeneration("long")).toBe(true);
  });

  it("syncs usage from API snapshot", () => {
    syncAiUsage({
      plan: "pro",
      short: { count: 3, limit: 100, remaining: 97 },
      long: { count: 1, limit: 50, remaining: 49 },
    });
    const usage = getAiUsage();
    expect(usage.plan).toBe("pro");
    expect(usage.short.count).toBe(3);
    expect(usage.long.count).toBe(1);
  });

  it("blocks usage after the short monthly limit", () => {
    syncAiUsage({
      plan: "free",
      short: {
        count: PLAN_LIMITS.free.short,
        limit: PLAN_LIMITS.free.short,
        remaining: 0,
      },
      long: { count: 0, limit: PLAN_LIMITS.free.long, remaining: PLAN_LIMITS.free.long },
    });
    expect(canUseAiGeneration("short")).toBe(false);
    expect(canUseAiGeneration("long")).toBe(true);
  });
});
