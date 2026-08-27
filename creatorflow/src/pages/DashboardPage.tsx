import { ArrowRight, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AddIdeaDialog } from "../components/AddIdeaDialog";
import { SharePackRow } from "../components/SharePackRow";
import {
  ScriptGenerateDialog,
  type ScriptGenerateOptions,
} from "../components/ScriptGenerateDialog";
import { Button } from "../components/ui";
import { useIdeas, isGenerateScriptError } from "../context/IdeasContext";
import { getNextUp, type Idea } from "../data/demo";
import { useAuth } from "../hooks/useAuth";
import { useI18n } from "../i18n/context";
import { getAppleProfile } from "../lib/auth/session";
import { deriveNextAction } from "../lib/nextAction";

export function DashboardPage() {
  const { tr } = useI18n();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { ideas, moveIdea, generateScript } = useIdeas();
  const [addOpen, setAddOpen] = useState(false);
  const [dialogIdea, setDialogIdea] = useState<Idea | null>(null);
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [helloName, setHelloName] = useState("");

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      if (isAuthenticated) {
        const profile = await getAppleProfile();
        if (!cancelled) {
          setHelloName(profile.displayName?.trim() || tr("settings.appleUser"));
        }
        return;
      }
      if (!cancelled) setHelloName(tr("settings.demoName"));
    })();
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, tr]);

  const nextUp = getNextUp(ideas);
  const nextAction = deriveNextAction(nextUp);

  async function handleGenerateSubmit(idea: Idea, options: ScriptGenerateOptions) {
    setGeneratingId(idea.id);
    try {
      await generateScript(idea.id, options);
      setDialogIdea(null);
    } catch (error) {
      if (isGenerateScriptError(error) && error.error === "LIMIT_REACHED") {
        setDialogIdea(null);
      }
    } finally {
      setGeneratingId(null);
    }
  }

  function handleNextAction() {
    if (nextAction.kind === "create") {
      setAddOpen(true);
      return;
    }
    if (!nextUp) return;
    if (nextAction.kind === "write") {
      setDialogIdea(nextUp);
      return;
    }
    if (nextAction.kind === "shoot" && nextAction.route) {
      navigate(nextAction.route);
    }
  }

  return (
    <>
      <AddIdeaDialog open={addOpen} onClose={() => setAddOpen(false)} />
      <div className="mx-auto flex min-h-[70vh] max-w-xl flex-col justify-center gap-8">
        <header className="flex items-start justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            {tr("dashboard.hello", { name: helloName || tr("settings.guestName") })}
          </p>
          <Button
            type="button"
            variant="ghost"
            className="h-11 shrink-0 px-3"
            onClick={() => setAddOpen(true)}
            aria-label={tr("dashboard.newIdea")}
          >
            <Plus className="size-4" />
            <span className="hidden sm:inline">{tr("dashboard.newIdea")}</span>
          </Button>
        </header>

        <section className="flex flex-col items-start gap-6">
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            {tr(`dashboard.prompt.${nextAction.kind}`)}
          </h1>

          {nextAction.kind === "pack" && nextUp ? (
            <SharePackRow
              idea={nextUp}
              className="w-full"
              onShared={() => moveIdea(nextUp.id, "published")}
            />
          ) : (
            <Button type="button" className="h-12 px-8 text-[15px]" onClick={handleNextAction}>
              {tr(`dashboard.nextAction.${nextAction.kind}`)}
              <ArrowRight className="size-4" />
            </Button>
          )}

          <Link
            to="/app/pipeline"
            className="inline-flex h-11 items-center text-sm font-semibold text-primary"
          >
            {tr("dashboard.seePipeline")}
            <ArrowRight className="ml-1 size-3.5" />
          </Link>
        </section>
      </div>

      <ScriptGenerateDialog
        idea={dialogIdea}
        open={dialogIdea !== null}
        onClose={() => setDialogIdea(null)}
        onSubmit={handleGenerateSubmit}
        isGenerating={generatingId === dialogIdea?.id}
      />
    </>
  );
}
