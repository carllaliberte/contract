import type { Idea } from "../data/demo";

export type NextActionKind = "write" | "shoot" | "pack" | "create";

export type NextAction = {
  kind: NextActionKind;
  route?: string;
};

export function deriveNextAction(idea: Idea | null): NextAction {
  if (!idea || idea.status === "published") {
    return { kind: "create" };
  }
  switch (idea.status) {
    case "idea":
      return { kind: "write" };
    case "script":
    case "production":
      return { kind: "shoot", route: `/app/shoot/${idea.id}` };
    case "ready":
      return { kind: "pack" };
    default:
      return { kind: "create" };
  }
}
