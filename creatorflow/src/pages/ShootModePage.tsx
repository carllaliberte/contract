import { ArrowLeft, Check, WifiOff } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Button } from "../components/ui";
import { useIdeas } from "../context/IdeasContext";
import { useI18n } from "../i18n/context";
import { useNetworkStatus } from "../hooks/useNetworkStatus";

export function ShootModePage() {
  const { ideaId } = useParams<{ ideaId: string }>();
  const { ideas, moveIdea } = useIdeas();
  const { tr } = useI18n();
  const navigate = useNavigate();
  const online = useNetworkStatus();
  const idea = ideas.find((item) => item.id === ideaId);

  if (!idea) {
    return (
      <div className="mx-auto max-w-2xl py-12 text-center">
        <p className="text-sm text-muted-foreground">{tr("shoot.notFound")}</p>
        <Link
          to="/app/pipeline"
          className="mt-4 inline-flex h-11 items-center justify-center rounded-xl border border-border px-4 text-sm font-semibold hover:bg-secondary/80"
        >
          {tr("shoot.backPipeline")}
        </Link>
      </div>
    );
  }

  const shootIdea = idea;
  const scriptText = shootIdea.script?.trim() ?? shootIdea.description;
  const canMarkReady = shootIdea.status === "production" || shootIdea.status === "script";

  function handleMarkReady() {
    moveIdea(shootIdea.id, "ready");
    navigate("/app");
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <Link
          to="/app/pipeline"
          className="inline-flex h-10 items-center gap-1.5 rounded-xl px-3 text-sm font-medium hover:bg-secondary"
        >
          <ArrowLeft className="size-4" />
          {tr("shoot.backPipeline")}
        </Link>
        {!online && (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2.5 py-1 text-xs font-medium text-amber-700">
            <WifiOff className="size-3.5" />
            {tr("shoot.offline")}
          </span>
        )}
      </div>

      <header className="rounded-2xl border border-border bg-card p-4 shadow-card">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {tr("shoot.mode")}
        </p>
        <h1 className="mt-1 text-xl font-semibold tracking-tight">{idea.title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{idea.description}</p>
      </header>

      <section
        className="min-h-[50vh] rounded-2xl border border-border bg-zinc-950 p-6 text-zinc-50 shadow-card"
        aria-label={tr("shoot.script")}
      >
        <pre className="whitespace-pre-wrap text-base leading-relaxed sm:text-lg">
          {scriptText}
        </pre>
      </section>

      {canMarkReady && (
        <Button type="button" className="h-12 w-full" onClick={handleMarkReady}>
          <Check className="size-4" />
          {tr("shoot.markReady")}
        </Button>
      )}
    </div>
  );
}
