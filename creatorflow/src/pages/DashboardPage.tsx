import { ArrowRight } from "lucide-react";
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
      language: idea.platform === "x" ? "en" : "fr",
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
  const { locale } = useI18n();
  const navigate = useNavigate();
  const { ideas } = useIdeas();
  const { isApplying, confirmApply } = useScriptPackFlow();
  const [open, setOpen] = useState<Idea | null>(null);

  const wall = useMemo(
    () => ideas.filter((idea) => idea.status !== "published").slice(0, 6),
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
      <div className="mx-auto flex min-h-[70vh] max-w-xl flex-col justify-center gap-6">
        <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
          <span className="rec-dot" />
          REC
        </p>
        <h1 className="font-display text-3xl font-medium italic tracking-tight sm:text-4xl">
          {hook || open.title}
        </h1>
        {script ? (
          <pre className="w-full whitespace-pre-wrap rounded-2xl border border-border bg-card/80 p-5 text-sm leading-relaxed">
            {script}
          </pre>
        ) : null}
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            type="button"
            className="h-14 flex-1 text-base"
            disabled={isApplying}
            onClick={() => void handleFilm()}
          >
            {locale === "fr" ? "Tourner" : "Film"}
            <ArrowRight className="size-5" />
          </Button>
          <Button
            type="button"
            variant="outline"
            className="h-14 flex-1 text-base"
            disabled={isApplying}
            onClick={() => setOpen(null)}
          >
            {locale === "fr" ? "Autre script" : "Another script"}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl">
      <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
        <span className="rec-dot" />
        REC
      </p>
      <h1 className="mt-4 font-display text-3xl font-medium italic tracking-tight sm:text-4xl">
        {locale === "fr" ? "Explorez les scripts Clapshot" : "Explore Clapshot scripts"}
      </h1>
      <p className="mt-3 text-sm text-muted-foreground">
        {locale === "fr" ? "Un tap. Tu lis. Tu tournes." : "One tap. You read. You film."}
      </p>
      <ul className="mt-8 flex flex-col gap-3">
        {wall.map((idea) => (
          <li key={idea.id}>
            <button
              type="button"
              onClick={() => setOpen(idea)}
              className="w-full rounded-2xl border border-border bg-card/80 p-4 text-left transition-colors hover:border-primary/50 hover:bg-card"
            >
              <p className="font-medium leading-snug">{idea.title}</p>
              <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{idea.description}</p>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
