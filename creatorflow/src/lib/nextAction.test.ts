import { describe, expect, it } from "vitest";
import { demoIdeas } from "../data/demo";
import { deriveNextAction } from "./nextAction";

describe("deriveNextAction", () => {
  it("suggests write for idea status", () => {
    const idea = demoIdeas.find((i) => i.status === "idea");
    expect(deriveNextAction(idea!)).toEqual({ kind: "write" });
  });

  it("suggests shoot for script status", () => {
    const idea = demoIdeas.find((i) => i.status === "script");
    expect(deriveNextAction(idea!)).toEqual({
      kind: "shoot",
      route: `/app/shoot/${idea!.id}`,
    });
  });

  it("suggests shoot mode for production", () => {
    const idea = demoIdeas.find((i) => i.status === "production");
    expect(deriveNextAction(idea!)).toEqual({
      kind: "shoot",
      route: `/app/shoot/${idea!.id}`,
    });
  });

  it("suggests pack after tournage prêt", () => {
    const idea = demoIdeas.find((i) => i.status === "ready");
    expect(deriveNextAction(idea!)).toEqual({ kind: "pack" });
  });

  it("suggests create when nothing is in flight", () => {
    expect(deriveNextAction(null)).toEqual({ kind: "create" });
    const published = demoIdeas.find((i) => i.status === "published");
    expect(deriveNextAction(published!)).toEqual({ kind: "create" });
  });
});
