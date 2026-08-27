import { describe, expect, it } from "vitest";
import { canAdvanceStatus, getNextStatus } from "./pipelineActions";

describe("pipelineActions", () => {
  it("returns the next status in the flow", () => {
    expect(getNextStatus("idea")).toBe("script");
    expect(getNextStatus("ready")).toBe("published");
    expect(getNextStatus("published")).toBeNull();
  });

  it("knows when an idea can advance", () => {
    expect(canAdvanceStatus("production")).toBe(true);
    expect(canAdvanceStatus("published")).toBe(false);
  });
});
