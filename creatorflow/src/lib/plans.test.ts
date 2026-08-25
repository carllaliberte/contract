import { describe, expect, it } from "vitest";
import {
  PLAN_LIMITS,
  allowedLongDurations,
  defaultLongDuration,
  limitForFormat,
} from "./plans";

describe("PLAN_LIMITS", () => {
  it("free long durations respect maxLongMinutes", () => {
    expect(allowedLongDurations("free")).toEqual([8, 12]);
    expect(PLAN_LIMITS.free.maxLongMinutes).toBe(12);
  });

  it("pro long durations respect maxLongMinutes", () => {
    expect(allowedLongDurations("pro")).toEqual([8, 12, 20, 30]);
    expect(PLAN_LIMITS.pro.maxLongMinutes).toBe(30);
  });

  it("default long duration is the plan maximum allowed", () => {
    expect(defaultLongDuration("free")).toBe(12);
    expect(defaultLongDuration("pro")).toBe(30);
  });

  it("exposes short and long quotas per plan", () => {
    expect(limitForFormat("free", "short")).toBe(8);
    expect(limitForFormat("free", "long")).toBe(2);
    expect(limitForFormat("pro", "short")).toBe(100);
    expect(limitForFormat("pro", "long")).toBe(50);
  });
});
