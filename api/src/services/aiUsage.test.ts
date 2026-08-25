import { beforeEach, describe, expect, it } from "vitest";
import {
  assertCanGenerate,
  clearMemoryUsageStore,
  memoryUsageStore,
} from "./aiUsage.js";
import { env } from "../env.js";

describe("memoryUsageStore", () => {
  beforeEach(() => {
    clearMemoryUsageStore();
  });

  it("starts at zero usage", async () => {
    const usage = await memoryUsageStore.getUsage("demo:test");
    expect(usage).toEqual({
      count: 0,
      limit: env.monthlyAiLimit,
      remaining: env.monthlyAiLimit,
    });
  });

  it("increments usage", async () => {
    const first = await memoryUsageStore.incrementUsage("demo:test");
    expect(first.count).toBe(1);
    expect(first.remaining).toBe(env.monthlyAiLimit - 1);
  });

  it("blocks when limit reached", async () => {
    for (let i = 0; i < env.monthlyAiLimit; i++) {
      await memoryUsageStore.incrementUsage("demo:full");
    }
    await expect(assertCanGenerate(memoryUsageStore, "demo:full")).rejects.toThrow(
      "LIMIT_REACHED",
    );
  });
});
