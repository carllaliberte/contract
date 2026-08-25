import { beforeEach, describe, expect, it } from "vitest";
import { PLAN_LIMITS } from "../limits.js";
import {
  assertCanGenerate,
  clearMemoryUsageStore,
  memoryUsageStore,
} from "./aiUsage.js";

describe("memoryUsageStore", () => {
  beforeEach(() => {
    clearMemoryUsageStore();
  });

  it("starts at zero usage", async () => {
    const usage = await memoryUsageStore.getUsage("demo:test");
    expect(usage.plan).toBe("free");
    expect(usage.short).toEqual({
      count: 0,
      limit: PLAN_LIMITS.free.short,
      remaining: PLAN_LIMITS.free.short,
    });
    expect(usage.long.remaining).toBe(PLAN_LIMITS.free.long);
  });

  it("increments short usage", async () => {
    const first = await memoryUsageStore.incrementUsage("demo:test", "short");
    expect(first.short.count).toBe(1);
    expect(first.short.remaining).toBe(PLAN_LIMITS.free.short - 1);
  });

  it("blocks when short limit reached", async () => {
    for (let i = 0; i < PLAN_LIMITS.free.short; i++) {
      await memoryUsageStore.incrementUsage("demo:full", "short");
    }
    await expect(
      assertCanGenerate(memoryUsageStore, "demo:full", "short"),
    ).rejects.toThrow("LIMIT_REACHED");
  });

  it("tracks long usage separately", async () => {
    const first = await memoryUsageStore.incrementUsage("demo:long", "long");
    expect(first.long.count).toBe(1);
    expect(first.short.count).toBe(0);
  });
});
