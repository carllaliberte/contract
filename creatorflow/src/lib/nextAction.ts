import type { Idea } from "../data/demo";
import { getNextStatus } from "./pipelineActions";

export type NextActionKind = "generate" | "advance" | "shoot" | "publish";

export type NextAction = {
  kind: NextActionKind;
  route?: string;
};

export function deriveNextAction(idea: Idea): NextAction {
  switch (idea.status) {
    case "idea":
      return { kind: "generate" };
    case "script": {
      const next = getNextStatus(idea.status);
      return next ? { kind: "advance" } : { kind: "generate" };
    }
    case "production":
      return { kind: "shoot", route: `/app/shoot/${idea.id}` };
    case "ready":
      return { kind: "publish" };
    default:
      return { kind: "advance" };
  }
}
