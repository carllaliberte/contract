import { beforeEach, describe, expect, it } from "vitest";
import { canUseAiGeneration, getAiUsage, recordAiGeneration } from "./aiUsage";

describe("aiUsage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("starts with the free-plan monthly quota", () => {
    const usage = getAiUsage();
    expect(usage.limit).toBe(8);
    expect(usage.count).toBe(0);
    expect(usage.remaining).toBe(8);
    expect(canUseAiGeneration()).toBe(true);
  });

  it("decrements remaining generations", () => {
    expect(recordAiGeneration()).toBe(true);
    expect(getAiUsage().remaining).toBe(7);
  });

  it("blocks usage after the monthly limit", () => {
    for (let i = 0; i < 8; i++) {
      expect(recordAiGeneration()).toBe(true);
    }
    expect(canUseAiGeneration()).toBe(false);
    expect(getAiUsage().remaining).toBe(0);
    expect(recordAiGeneration()).toBe(false);
  });
});
