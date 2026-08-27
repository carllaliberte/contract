import type { ContentPackage } from "../types/aiContext";
import type { Idea, IdeaStatus } from "../data/demo";

export type ApplyPackPatch = Pick<
  Idea,
  "script" | "description" | "packTitles" | "packHashtags" | "packCaption" | "status"
> & {
  updatedAt: string;
};

/**
 * Maps an accepted ContentPackage onto Idea fields.
 * Does not auto-advance status unless `advanceFromIdea` is true (default).
 */
export function buildApplyPackPatch(
  idea: Idea,
  pack: ContentPackage,
  options: { advanceFromIdea?: boolean } = {},
): ApplyPackPatch {
  const advanceFromIdea = options.advanceFromIdea ?? true;
  const nextStatus: IdeaStatus =
    advanceFromIdea && idea.status === "idea" ? "script" : idea.status;

  return {
    script: pack.script,
    description: pack.description?.trim() ? pack.description : idea.description,
    packTitles: pack.titles?.length ? pack.titles : idea.packTitles,
    packHashtags: pack.hashtags?.length ? pack.hashtags : idea.packHashtags,
    packCaption: pack.description?.trim() ?? idea.packCaption,
    status: nextStatus,
    updatedAt: new Date().toISOString(),
  };
}
