import { describe, expect, it } from "vitest";
import { PLAN_LIMITS, limitForFormat, limitForPlan } from "./limits.js";

describe("PLAN_LIMITS", () => {
  it("defines free and pro quotas per format", () => {
    expect(PLAN_LIMITS.free).toEqual({ short: 8, long: 2, maxLongMinutes: 12 });
    expect(PLAN_LIMITS.pro).toEqual({ short: 100, long: 50, maxLongMinutes: 30 });
  });

  it("maps plan and format to limit", () => {
    expect(limitForFormat("free", "short")).toBe(8);
    expect(limitForFormat("free", "long")).toBe(2);
    expect(limitForFormat("pro", "short")).toBe(100);
    expect(limitForPlan("unknown")).toBe(8);
  });
});
