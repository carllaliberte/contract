import { ArrowRight } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AddIdeaDialog } from "../components/AddIdeaDialog";
import { PackApplyDialog } from "../components/PackApplyDialog";
import {
  ScriptGenerateDialog,
  type ScriptGenerateOptions,
} from "../components/ScriptGenerateDialog";
import { Button } from "../components/ui";
import { useIdeas } from "../context/IdeasContext";
import { getNextUp, type Idea } from "../data/demo";
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
    packPreview,
    isApplying,
    providerLabel,
    submitPreview,
    confirmApply,
    discardPreview,
  } = useScriptPackFlow();
  const [addOpen, setAddOpen] = useState(false);
  const [dialogIdea, setDialogIdea] = useState<Idea | null>(null);

  const nextUp = getNextUp(ideas);
  const nextAction = nextUp ? deriveNextAction(nextUp) : null;

  async function handleGenerateSubmit(idea: Idea, options: ScriptGenerateOptions) {
    setDialogIdea(null);
    await submitPreview(idea, options);
  }

  function handleNextAction() {
    if (!nextUp || !nextAction) {
      setAddOpen(true);
      return;
    }
    if (nextAction.kind === "generate") {
      setDialogIdea(nextUp);
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

  return (
    <>
      <AddIdeaDialog open={addOpen} onClose={() => setAddOpen(false)} />
      <div className="mx-auto flex min-h-[70vh] max-w-xl flex-col justify-center gap-8">
        <section className="flex flex-col items-start gap-6">
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            <span className="rec-dot" />
            REC
          </p>
          <h1 className="font-display text-3xl font-medium italic tracking-tight sm:text-5xl sm:leading-[1.08]">
            {nextUp && nextAction
              ? tr(`dashboard.prompt.${nextAction.kind}`, { title: nextUp.title })
              : tr("app.heroTitle")}
          </h1>

          <Button
            type="button"
            className="h-14 px-8 text-base sm:h-16 sm:px-10 sm:text-lg"
            onClick={handleNextAction}
          >
            {nextAction
              ? tr(`dashboard.nextAction.${nextAction.kind}`)
              : tr("login.start")}
            <ArrowRight className="size-5" />
          </Button>
        </section>
      </div>

      <ScriptGenerateDialog
        idea={dialogIdea}
        open={dialogIdea !== null}
        onClose={() => setDialogIdea(null)}
        onSubmit={handleGenerateSubmit}
        isGenerating={generatingId === dialogIdea?.id}
      />
      <PackApplyDialog
        idea={packPreview?.idea ?? null}
        pack={packPreview?.pack ?? null}
        open={packPreview !== null}
        providerLabel={providerLabel}
        onClose={discardPreview}
        onApply={confirmApply}
        isApplying={isApplying}
      />
    </>
  );
}
