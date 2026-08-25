import { Play, Sparkles } from "lucide-react";
import { useState } from "react";
import { Button } from "../components/ui";
import { useIdeas } from "../context/IdeasContext";
import type { Idea } from "../data/demo";
import { useI18n } from "../i18n/context";
import { canUseAiGeneration } from "../lib/aiUsage";

export function ContentsPage() {
  const { tr } = useI18n();
  const { ideas, generateScript } = useIdeas();
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const withMedia = ideas.filter((i) => i.videoUrl || i.script || i.status === "idea" || i.status === "script");

  async function handleGenerate(idea: Idea) {
    if (!canUseAiGeneration()) {
      setNotice(tr("script.limitReached"));
      return;
    }
    setGeneratingId(idea.id);
    setNotice(null);
    await generateScript(idea.id);
    setGeneratingId(null);
  }

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">{tr("contents.title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{tr("contents.subtitle")}</p>
      </header>

      {notice && (
        <p className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {notice}
        </p>
      )}

      <div className="grid gap-6 sm:grid-cols-2">
        {withMedia.map((item) => (
          <article
            key={item.id}
            className="overflow-hidden rounded-2xl border border-border bg-card shadow-card"
          >
            <div className="relative aspect-video bg-black">
              {item.videoUrl ? (
                <video
                  className="size-full object-cover"
                  controls
                  playsInline
                  poster={item.thumbnail}
                  preload="metadata"
                >
                  <source src={item.videoUrl} type="video/mp4" />
                </video>
              ) : (
                <img src={item.thumbnail} alt="" className="size-full object-cover" />
              )}
              <span className="absolute left-3 top-3 rounded-md bg-black/60 px-2 py-0.5 text-xs font-medium text-white backdrop-blur-sm">
                {tr(`status.${item.status}`)}
              </span>
            </div>
            <div className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h2 className="font-medium">{item.title}</h2>
                  <p className="mt-1 text-xs uppercase tracking-wide text-muted-foreground">
                    {item.platform}
                  </p>
                </div>
                {item.videoUrl && (
                  <Play className="size-5 shrink-0 text-primary" aria-hidden />
                )}
              </div>
              {item.script && (
                <p className="mt-3 line-clamp-4 rounded-lg bg-secondary/50 p-3 text-xs leading-relaxed text-muted-foreground whitespace-pre-line">
                  {item.script}
                </p>
              )}
              {(item.status === "idea" || item.status === "script") && (
                <Button
                  type="button"
                  variant="secondary"
                  className="mt-3 h-9 w-full text-xs"
                  disabled={generatingId === item.id}
                  onClick={() => handleGenerate(item)}
                >
                  <Sparkles className="size-3.5" />
                  {generatingId === item.id ? tr("script.generating") : tr("script.generate")}
                </Button>
              )}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
