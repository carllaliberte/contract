import { ArrowLeft, WifiOff } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { SharePackRow } from "../components/SharePackRow";
import { useIdeas } from "../context/IdeasContext";
import { useI18n } from "../i18n/context";
import { useNetworkStatus } from "../hooks/useNetworkStatus";

export function ShootModePage() {
  const { ideaId } = useParams<{ ideaId: string }>();
  const { ideas } = useIdeas();
  const { tr } = useI18n();
  const online = useNetworkStatus();
  const idea = ideas.find((item) => item.id === ideaId);

  if (!idea) {
    return (
      <div className="mx-auto max-w-2xl py-12 text-center">
        <p className="text-sm text-muted-foreground">{tr("shoot.notFound")}</p>
        <Link
          to="/app"
          className="mt-4 inline-flex h-11 items-center justify-center rounded-xl border border-border px-4 text-sm font-semibold hover:bg-secondary/80"
        >
          {tr("nav.dashboard")}
        </Link>
      </div>
    );
  }

  const scriptText = idea.script?.trim() ?? idea.description;

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <Link
          to="/app"
          className="inline-flex h-10 items-center gap-1.5 rounded-xl px-3 text-sm font-medium hover:bg-secondary"
        >
          <ArrowLeft className="size-4" />
          {tr("nav.dashboard")}
        </Link>
        {!online && (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2.5 py-1 text-xs font-medium text-amber-700">
            <WifiOff className="size-3.5" />
            {tr("shoot.offline")}
          </span>
        )}
      </div>

      <h1 className="text-2xl font-semibold tracking-tight">{idea.title}</h1>
      <section className="min-h-[40vh] rounded-2xl border border-border bg-zinc-950 p-5 text-zinc-50">
        <pre className="whitespace-pre-wrap text-[15px] leading-relaxed">{scriptText}</pre>
      </section>
      <SharePackRow idea={idea} />
    </div>
  );
}
