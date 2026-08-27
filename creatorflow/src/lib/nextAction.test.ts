import { describe, expect, it } from "vitest";
import { demoIdeas } from "../data/demo";
import { deriveNextAction } from "./nextAction";

describe("deriveNextAction", () => {
  it("suggests generate for idea status", () => {
    const idea = demoIdeas.find((i) => i.status === "idea");
    expect(deriveNextAction(idea!)).toEqual({ kind: "generate" });
  });

  it("suggests advance for script status", () => {
    const idea = demoIdeas.find((i) => i.status === "script");
    expect(deriveNextAction(idea!)).toEqual({ kind: "advance" });
  });

  it("suggests shoot mode for production", () => {
    const idea = demoIdeas.find((i) => i.status === "production");
    expect(deriveNextAction(idea!)).toEqual({
      kind: "shoot",
      route: `/app/shoot/${idea!.id}`,
    });
  });

  it("suggests publish for ready", () => {
    const idea = demoIdeas.find((i) => i.status === "ready");
    expect(deriveNextAction(idea!)).toEqual({ kind: "publish" });
  });
});
