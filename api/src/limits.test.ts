import { describe, expect, it } from "vitest";
import { LIMITS, limitForPlan } from "./limits.js";

describe("LIMITS", () => {
  it("defines free and pro monthly caps", () => {
    expect(LIMITS).toEqual({ free: 8, pro: 200 });
  });

  it("maps plan to limit", () => {
    expect(limitForPlan("free")).toBe(8);
    expect(limitForPlan("pro")).toBe(200);
    expect(limitForPlan("unknown")).toBe(8);
  });
});
