import { beforeEach, describe, expect, it } from "vitest";
import { LIMITS } from "../limits.js";
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
    expect(usage).toEqual({
      count: 0,
      limit: LIMITS.free,
      remaining: LIMITS.free,
    });
  });

  it("increments usage", async () => {
    const first = await memoryUsageStore.incrementUsage("demo:test");
    expect(first.count).toBe(1);
    expect(first.remaining).toBe(LIMITS.free - 1);
  });

  it("blocks when limit reached", async () => {
    for (let i = 0; i < LIMITS.free; i++) {
      await memoryUsageStore.incrementUsage("demo:full");
    }
    await expect(assertCanGenerate(memoryUsageStore, "demo:full")).rejects.toThrow(
      "LIMIT_REACHED",
    );
  });
});
