import { ArrowRight, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AddIdeaDialog } from "../components/AddIdeaDialog";
import {
  ScriptGenerateDialog,
  type ScriptGenerateOptions,
} from "../components/ScriptGenerateDialog";
import { Button, Card } from "../components/ui";
import { useIdeas, isGenerateScriptError } from "../context/IdeasContext";
import { countByStatus, getNextUp, type Idea, type IdeaStatus } from "../data/demo";
import { useAuth } from "../hooks/useAuth";
import { useI18n } from "../i18n/context";
import { getAppleProfile } from "../lib/auth/session";
import { deriveNextAction } from "../lib/nextAction";
import { getNextStatus } from "../lib/pipelineActions";

const statuses: IdeaStatus[] = ["idea", "script", "production", "ready", "published"];

const statusColors: Record<IdeaStatus, string> = {
  idea: "bg-status-idea/15 text-status-idea",
  script: "bg-status-script/15 text-status-script",
  production: "bg-status-production/15 text-status-production",
  ready: "bg-status-ready/15 text-status-ready",
  published: "bg-status-published/15 text-status-published",
};

function formatDate(iso: string, locale: string) {
  return new Intl.DateTimeFormat(locale, { day: "numeric", month: "short" }).format(new Date(iso));
}

export function DashboardPage() {
  const { tr, locale } = useI18n();
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
  const counts = countByStatus(ideas);
  const nextUp = getNextUp(ideas);
  const nextAction = nextUp ? deriveNextAction(nextUp) : null;
  const recent = [...ideas].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 4);

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
    if (!nextUp || !nextAction) return;
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

  const nextActionLabel = nextAction
    ? tr(`dashboard.nextAction.${nextAction.kind}`)
    : tr("dashboard.open");

  return (
    <>
      <AddIdeaDialog open={addOpen} onClose={() => setAddOpen(false)} />
      <div className="mx-auto flex max-w-3xl flex-col gap-6">
        <header className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              {tr("dashboard.hello", { name: helloName || tr("settings.guestName") })}
            </h1>
            <p className="mt-1.5 text-sm text-muted-foreground">{tr("dashboard.subtitle")}</p>
          </div>
          <Button type="button" className="shrink-0" onClick={() => setAddOpen(true)}>
            <Plus className="size-4" />
            <span className="hidden sm:inline">{tr("dashboard.newIdea")}</span>
          </Button>
        </header>

        <section className="grid grid-cols-5 gap-1.5 sm:gap-2.5">
          {statuses.map((status) => (
            <Link
              key={status}
              to="/app/pipeline"
              className="flex flex-col items-center gap-1.5 rounded-2xl border border-border bg-card px-1 py-3 shadow-card transition-all hover:shadow-card-hover hover:-translate-y-0.5 sm:px-2"
            >
              <span
                className={`grid size-8 place-items-center rounded-lg text-sm font-bold tabular-nums ${statusColors[status]}`}
              >
                {counts[status] ?? 0}
              </span>
              <span className="text-[10px] font-medium text-muted-foreground sm:text-[11px]">
                {tr(`status.${status}`)}
              </span>
            </Link>
          ))}
        </section>

        {nextUp && (
          <Card className="!p-0 overflow-hidden">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <h2 className="text-sm font-semibold">{tr("dashboard.nextUp")}</h2>
              <span className="text-xs text-muted-foreground">
                {tr(`status.${nextUp.status}`)} · {tr(`priority.${nextUp.priority}`)}
              </span>
            </div>
            <div className="flex items-center gap-4 p-4">
              <img src={nextUp.thumbnail} alt="" className="size-[72px] shrink-0 rounded-xl object-cover" />
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium leading-snug">{nextUp.title}</p>
                <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                  {nextUp.script ?? nextUp.description}
                </p>
              </div>
            </div>
            <div className="flex gap-2 border-t border-border px-4 py-3">
              <Button type="button" className="flex-1" onClick={handleNextAction}>
                {nextActionLabel}
                <ArrowRight className="size-3.5" />
              </Button>
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => navigate("/app/pipeline")}
              >
                {tr("dashboard.seePipeline")}
              </Button>
            </div>
          </Card>
        )}

        <Card className="!p-0 overflow-hidden">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <h2 className="text-sm font-semibold">{tr("dashboard.recent")}</h2>
            <Link
              to="/app/pipeline"
              className="inline-flex items-center gap-1 text-xs font-semibold text-primary"
            >
              {tr("dashboard.seePipeline")}
              <ArrowRight className="size-3.5" />
            </Link>
          </div>
          <ul className="flex flex-col">
            {recent.map((idea, i) => (
              <li key={idea.id}>
                <div
                  className={`flex items-start gap-3.5 px-4 py-3.5 ${i > 0 ? "border-t border-border" : ""}`}
                >
                  <img src={idea.thumbnail} alt="" className="size-11 shrink-0 rounded-lg object-cover" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium leading-snug">{idea.title}</p>
                    <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">{idea.description}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-xs font-medium text-muted-foreground">
                      {tr(`status.${idea.status}`)}
                    </p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground/75">
                      {formatDate(idea.updatedAt, locale)}
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </Card>
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
