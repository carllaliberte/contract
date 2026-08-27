import { beforeEach, describe, expect, it } from "vitest";
import { checkAiRateLimit, clearRateLimitStore } from "./rateLimit.js";

describe("checkAiRateLimit", () => {
  beforeEach(() => {
    clearRateLimitStore();
  });

  it("allows requests under the burst limit", () => {
    expect(checkAiRateLimit("user-a").allowed).toBe(true);
    expect(checkAiRateLimit("user-a").allowed).toBe(true);
  });

  it("blocks when burst limit exceeded", () => {
    for (let i = 0; i < 6; i++) {
      expect(checkAiRateLimit("user-b").allowed).toBe(true);
    }
    const blocked = checkAiRateLimit("user-b");
    expect(blocked.allowed).toBe(false);
    if (!blocked.allowed) {
      expect(blocked.retryAfterSeconds).toBeGreaterThan(0);
    }
  });
});
