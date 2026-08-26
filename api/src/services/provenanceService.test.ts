import { describe, expect, it } from "vitest";
import { hashPromptTitle } from "./provenanceService.js";

describe("hashPromptTitle", () => {
  it("returns a stable 16-char hex prefix", () => {
    const a = hashPromptTitle("My video idea");
    const b = hashPromptTitle("My video idea");
    expect(a).toBe(b);
    expect(a).toMatch(/^[a-f0-9]{16}$/);
  });

  it("differs for different titles", () => {
    expect(hashPromptTitle("A")).not.toBe(hashPromptTitle("B"));
  });
});
