import { Play, Sparkles, Loader2 } from "lucide-react";
import { useState } from "react";
import { Button } from "../components/ui";
import { PaywallSheet } from "../components/PaywallSheet";
import { SharePackRow } from "../components/SharePackRow";
import {
  ScriptGenerateDialog,
  type ScriptGenerateOptions,
} from "../components/ScriptGenerateDialog";
import { isGenerateScriptError, useIdeas } from "../context/IdeasContext";
import type { Idea } from "../data/demo";
import { useI18n } from "../i18n/context";
import { canUseAiGeneration, syncAiUsage } from "../lib/aiUsage";
import type { ScriptFormat } from "../lib/plans";
import { AiUsageBadge } from "../components/AiUsageBadge";
import { TtsPlayButton } from "../components/TtsPlayButton";
import { useAiUsage } from "../hooks/useAiUsage";
import { labelForPlatform } from "../lib/platforms";

export function ContentsPage() {
  const { tr } = useI18n();
  const { ideas, generateScript } = useIdeas();
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [dialogIdea, setDialogIdea] = useState<Idea | null>(null);
  const [paywallOpen, setPaywallOpen] = useState(false);
  const aiUsage = useAiUsage();

  const withMedia = ideas.filter((i) => i.videoUrl || i.script || i.status === "idea" || i.status === "script");

  function handlePaywall(format: ScriptFormat) {
    setDialogIdea(null);
    setNotice(
      tr(
        format === "long" ? "script.limitReachedLong" : "script.limitReachedShort",
        {
          limit: String(
            format === "long" ? aiUsage.long.limit : aiUsage.short.limit,
          ),
        },
      ),
    );
    setPaywallOpen(true);
  }

  async function handleGenerateSubmit(idea: Idea, options: ScriptGenerateOptions) {
    if (!canUseAiGeneration(options.format)) {
      handlePaywall(options.format);
      return;
    }
    setGeneratingId(idea.id);
    setNotice(null);
    try {
      await generateScript(idea.id, options);
      setDialogIdea(null);
    } catch (error) {
      if (error instanceof Error && error.message === "LIMIT_REACHED") {
        handlePaywall(options.format);
      } else if (isGenerateScriptError(error) && error.error === "LIMIT_REACHED") {
        if (error.usage) syncAiUsage(error.usage);
        handlePaywall(options.format);
      } else if (isGenerateScriptError(error)) {
        setNotice(error.message);
      } else {
        setNotice(tr("script.apiError"));
      }
    } finally {
      setGeneratingId(null);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{tr("contents.title")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{tr("contents.subtitle")}</p>
        </div>
        <AiUsageBadge />
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
                    {labelForPlatform(item.platform)}
                  </p>
                </div>
                {item.videoUrl && (
                  <Play className="size-5 shrink-0 text-primary" aria-hidden />
                )}
              </div>
              {item.script && (
                <>
                  <p className="mt-3 line-clamp-4 rounded-lg bg-secondary/50 p-3 text-xs leading-relaxed text-muted-foreground whitespace-pre-line">
                    {item.script}
                  </p>
                  <TtsPlayButton text={item.script} className="mt-2" />
                  <SharePackRow idea={item} className="mt-3" />
                </>
              )}
              {(item.status === "idea" || item.status === "script") && (
                <Button
                  type="button"
                  variant="secondary"
                  className="mt-3 h-9 w-full text-xs"
                  disabled={generatingId === item.id}
                  onClick={() => setDialogIdea(item)}
                >
                  <Sparkles className="size-3.5" />
                  {generatingId === item.id ? (
                    <>
                      <Loader2 className="size-3.5 animate-spin" aria-hidden />
                      {tr("script.generating")}
                    </>
                  ) : (
                    tr("script.generate")
                  )}
                </Button>
              )}
            </div>
          </article>
        ))}
      </div>

      <ScriptGenerateDialog
        idea={dialogIdea}
        open={dialogIdea !== null}
        onClose={() => setDialogIdea(null)}
        onSubmit={handleGenerateSubmit}
        isGenerating={generatingId === dialogIdea?.id}
        onPaywall={handlePaywall}
      />

      <PaywallSheet open={paywallOpen} onClose={() => setPaywallOpen(false)} />
    </div>
  );
}
