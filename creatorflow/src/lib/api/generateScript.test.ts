import { describe, expect, it } from "vitest";
import { isGrokNotConfiguredError } from "./generateScript";

describe("isGrokNotConfiguredError", () => {
  it("maps live OpenAI leftovers and missing xAI keys", () => {
    expect(
      isGrokNotConfiguredError({
        error: "PROVIDER_ERROR",
        message: "OPENAI_API_KEY is not configured",
      }),
    ).toBe(true);
    expect(
      isGrokNotConfiguredError({
        error: "PROVIDER_ERROR",
        message: "XAI_API_KEY is not configured",
      }),
    ).toBe(true);
    expect(
      isGrokNotConfiguredError({
        error: "PROVIDER_ERROR",
        message: "GROK_NOT_CONFIGURED",
      }),
    ).toBe(true);
    expect(
      isGrokNotConfiguredError({
        error: "PROVIDER_ERROR",
        message: "rate limited",
      }),
    ).toBe(false);
  });
});
