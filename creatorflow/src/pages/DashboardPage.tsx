import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui";
import { useIdeas } from "../context/IdeasContext";
import type { Idea } from "../data/demo";
import { useI18n } from "../i18n/context";
import { useScriptPackFlow } from "../hooks/useScriptPackFlow";
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

const platformLabel: Record<string, string> = {
  reels: "Reels",
  tiktok: "TikTok",
  youtube: "YouTube",
  x: "X",
};

export function DashboardPage() {
  const { locale } = useI18n();
  const navigate = useNavigate();
  const { ideas } = useIdeas();
  const { isApplying, confirmApply } = useScriptPackFlow();
  const [open, setOpen] = useState<Idea | null>(null);

  const wall = useMemo(
    () => ideas.filter((idea) => idea.status !== "published").slice(0, 8),
    [ideas],
  );

  const pack = open ? packFromIdea(open) : null;
  const hook = pack?.hooks?.find((item) => item.trim());
  const script = pack?.script?.trim();

  async function handleFilm() {
    if (!open || !pack) return;
    const ideaId = open.id;
    await confirmApply(open, pack);
    navigate(`/app/shoot/${ideaId}`);
  }

  if (open && pack) {
    return (
      <div className="mx-auto flex min-h-[70vh] max-w-lg flex-col justify-end gap-6 pb-4">
        <p className="text-sm text-muted-foreground">{open.title}</p>
        <h1 className="text-3xl font-semibold tracking-tight text-white">
          {hook || open.title}
        </h1>
        {script ? (
          <pre className="whitespace-pre-wrap text-[15px] leading-relaxed text-white/80">
            {script}
          </pre>
        ) : null}
        <Button
          type="button"
          className="h-14 w-full rounded-full bg-white text-base font-semibold text-black hover:bg-white/90"
          disabled={isApplying}
          onClick={() => void handleFilm()}
        >
          {locale === "fr" ? "Tourner" : "Film"}
        </Button>
        <button
          type="button"
          className="text-sm text-white/50"
          onClick={() => setOpen(null)}
        >
          {locale === "fr" ? "Autre script" : "Another script"}
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="text-2xl font-semibold tracking-tight">
        {locale === "fr" ? "Scripts" : "Scripts"}
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {locale === "fr" ? "Un tap. Tu lis. Tu tournes." : "One tap. You read. You film."}
      </p>
      <ul className="mt-6 divide-y divide-white/10">
        {wall.map((idea) => (
          <li key={idea.id}>
            <button
              type="button"
              onClick={() => setOpen(idea)}
              className="flex w-full items-center gap-3 py-4 text-left"
            >
              <img
                src={idea.thumbnail}
                alt=""
                className="size-11 shrink-0 rounded-full object-cover"
                onError={(event) => {
                  event.currentTarget.style.display = "none";
                }}
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate font-medium">{idea.title}</p>
                  <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white/70">
                    {platformLabel[idea.platform] ?? idea.platform}
                  </span>
                </div>
                <p className="mt-0.5 line-clamp-1 text-sm text-muted-foreground">{idea.description}</p>
              </div>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
