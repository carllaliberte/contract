import { useMemo, useState } from "react";
import { AddIdeaDialog } from "../components/AddIdeaDialog";
import { SharePackRow } from "../components/SharePackRow";
import { useIdeas } from "../context/IdeasContext";
import type { Idea } from "../data/demo";
import { getNextUp } from "../data/demo";
import { useI18n } from "../i18n/context";
import { buildBoothPack } from "../lib/boothPack";
import type { ContentPackage } from "../types/aiContext";

function packFromIdea(idea: Idea): ContentPackage {
  if (idea.script?.trim()) {
    return {
      ideaId: idea.id,
      platform: idea.platform,
      language: "fr",
      format: "short",
      script: idea.script,
      titles: idea.packTitles?.length ? idea.packTitles : [idea.title],
      description: idea.packCaption || idea.description,
      hashtags: idea.packHashtags,
      hooks: idea.packHooks,
      source: "accepted",
    };
  }
  return buildBoothPack(idea);
}

export function DashboardPage() {
  const { tr } = useI18n();
  const { ideas } = useIdeas();
  const [pickedId, setPickedId] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);

  const waiting = useMemo(
    () => ideas.filter((idea) => idea.status !== "published"),
    [ideas],
  );
  const filmed = ideas.length - waiting.length;
  const featured =
    waiting.find((idea) => idea.id === pickedId) ?? getNextUp(ideas) ?? waiting[0] ?? null;
  const pack = featured ? packFromIdea(featured) : null;
  const hook = pack?.hooks?.find((item) => item.trim()) ?? featured?.title;
  const script = pack?.script?.trim();
  const shareIdea = featured && pack
    ? {
        ...featured,
        script: pack.script,
        packTitles: pack.titles,
        packCaption: pack.description,
        packHashtags: pack.hashtags,
        packHooks: pack.hooks,
      }
    : null;

  function skip() {
    if (!featured || waiting.length < 2) return;
    const index = waiting.findIndex((idea) => idea.id === featured.id);
    const next = waiting[(index + 1) % waiting.length];
    setPickedId(next?.id ?? null);
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-lg flex-col justify-end gap-6 pb-4">
      <div className="flex items-end justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-muted-foreground">
          {tr("booth.kicker")}
        </p>
        <p className="text-xs tabular-nums text-muted-foreground">
          {tr("booth.tally", {
            waiting: String(waiting.length),
            filmed: String(filmed),
          })}
        </p>
      </div>

      {featured && shareIdea ? (
        <>
          <p className="text-sm text-muted-foreground">{featured.title}</p>
          <h1 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">{hook}</h1>
          {script ? (
            <pre className="max-h-48 overflow-auto whitespace-pre-wrap text-[15px] leading-relaxed text-muted-foreground">
              {script}
            </pre>
          ) : null}

          <SharePackRow idea={shareIdea} />
          {waiting.length > 1 ? (
            <button
              type="button"
              className="h-11 text-sm text-muted-foreground hover:text-foreground"
              onClick={skip}
            >
              {tr("booth.skip")}
            </button>
          ) : null}
        </>
      ) : (
        <h1 className="text-3xl font-semibold tracking-tight text-balance">{tr("booth.empty")}</h1>
      )}

      <button
        type="button"
        className="h-11 text-sm text-muted-foreground hover:text-foreground"
        onClick={() => setAddOpen(true)}
      >
        {tr("dashboard.newIdea")}
      </button>

      <AddIdeaDialog open={addOpen} onClose={() => setAddOpen(false)} />
    </div>
  );
}
