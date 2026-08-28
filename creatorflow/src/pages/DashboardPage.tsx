import { ArrowRight, Loader2 } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AddIdeaDialog } from "../components/AddIdeaDialog";
import { Button } from "../components/ui";
import { useIdeas } from "../context/IdeasContext";
import { getNextUp } from "../data/demo";
import { useI18n } from "../i18n/context";
import { useScriptPackFlow } from "../hooks/useScriptPackFlow";
import { deriveNextAction } from "../lib/nextAction";
import { getNextStatus } from "../lib/pipelineActions";

export function DashboardPage() {
  const { tr } = useI18n();
  const navigate = useNavigate();
  const { ideas, moveIdea } = useIdeas();
  const {
    generatingId,
    notice,
    packPreview,
    isApplying,
    submitPreview,
    confirmApply,
    discardPreview,
  } = useScriptPackFlow();
  const [addOpen, setAddOpen] = useState(false);

  const nextUp = getNextUp(ideas);
  const nextAction = nextUp ? deriveNextAction(nextUp) : null;
  const busy = Boolean(generatingId) || isApplying;
  const hook = packPreview?.pack.hooks?.find((item) => item.trim());
  const script = packPreview?.pack.script?.trim();

  async function handleNextAction() {
    if (!nextUp || !nextAction) {
      setAddOpen(true);
      return;
    }
    if (nextAction.kind === "generate") {
      await submitPreview(nextUp, { format: "short" });
      return;
    }
    if (nextAction.kind === "shoot" && nextAction.route) {
      navigate(nextAction.route);
      return;
    }
    if (nextAction.kind === "publish") {
      moveIdea(nextUp.id, "published");
      return;
    }
    const nextStatus = getNextStatus(nextUp.status);
    if (nextStatus) moveIdea(nextUp.id, nextStatus);
  }

  async function handleFilm() {
    if (!packPreview) return;
    const ideaId = packPreview.idea.id;
    await confirmApply(packPreview.idea, packPreview.pack);
    navigate(`/app/shoot/${ideaId}`);
  }

  return (
    <>
      <AddIdeaDialog open={addOpen} onClose={() => setAddOpen(false)} />
      <div className="mx-auto flex min-h-[70vh] max-w-xl flex-col justify-center gap-8">
        <section className="flex flex-col items-start gap-6">
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            <span className="rec-dot" />
            REC
          </p>

          {!packPreview ? (
            <>
              <h1 className="font-display text-3xl font-medium italic tracking-tight sm:text-5xl sm:leading-[1.08]">
                {nextUp && nextAction
                  ? tr(`dashboard.prompt.${nextAction.kind}`, { title: nextUp.title })
                  : tr("app.heroTitle")}
              </h1>
              <Button
                type="button"
                className="h-14 px-8 text-base sm:h-16 sm:px-10 sm:text-lg"
                disabled={busy}
                onClick={() => void handleNextAction()}
              >
                {busy ? (
                  <>
                    <Loader2 className="size-5 animate-spin" aria-hidden />
                    {tr("script.generating")}
                  </>
                ) : (
                  <>
                    {nextAction
                      ? tr(`dashboard.nextAction.${nextAction.kind}`)
                      : tr("login.start")}
                    <ArrowRight className="size-5" />
                  </>
                )}
              </Button>
            </>
          ) : (
            <>
              <h1 className="font-display text-3xl font-medium italic tracking-tight sm:text-4xl">
                {hook || packPreview.idea.title}
              </h1>
              {script ? (
                <pre className="w-full whitespace-pre-wrap rounded-2xl border border-border bg-card/80 p-4 text-sm leading-relaxed text-foreground">
                  {script}
                </pre>
              ) : null}
              <div className="flex w-full flex-col gap-2 sm:flex-row">
                <Button
                  type="button"
                  className="h-14 flex-1 text-base"
                  disabled={busy}
                  onClick={() => void handleFilm()}
                >
                  {isApplying ? tr("pack.applying") : tr("pipeline.shoot")}
                  <ArrowRight className="size-5" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="h-14 flex-1 text-base"
                  disabled={busy}
                  onClick={discardPreview}
                >
                  {tr("pack.discard")}
                </Button>
              </div>
            </>
          )}

          {notice ? (
            <p className="max-w-md text-sm text-destructive" role="status">
              {notice}
            </p>
          ) : null}
        </section>
      </div>
    </>
  );
}
