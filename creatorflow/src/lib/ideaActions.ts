import type { Idea } from "../data/demo";

export async function copyScriptToClipboard(script: string): Promise<boolean> {
  if (!script.trim()) return false;
  try {
    await navigator.clipboard.writeText(script);
    return true;
  } catch {
    return false;
  }
}

export function buildDuplicateIdea(
  source: Idea,
  copySuffix: string,
): Omit<Idea, "id" | "updatedAt"> {
  return {
    title: `${source.title}${copySuffix}`,
    description: source.description,
    status: "idea",
    priority: source.priority,
    platform: source.platform,
    scheduledAt: source.scheduledAt,
    script: source.script,
    thumbnail: source.thumbnail,
    videoUrl: source.videoUrl,
  };
}
