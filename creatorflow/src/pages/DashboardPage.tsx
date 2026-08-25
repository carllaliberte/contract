import { ArrowRight, Plus } from "lucide-react";
import { Link } from "react-router-dom";
import { Button, Card } from "../components/ui";
import { countByStatus, demoIdeas, getNextUp, type IdeaStatus } from "../data/demo";
import { useI18n } from "../i18n/context";

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
  const counts = countByStatus(demoIdeas);
  const nextUp = getNextUp(demoIdeas);
  const recent = [...demoIdeas].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 4);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <header className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            {tr("dashboard.hello", { name: "Alex" })}
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">{tr("dashboard.subtitle")}</p>
        </div>
        <Button className="shrink-0">
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
            <span className={`grid size-8 place-items-center rounded-lg text-sm font-bold tabular-nums ${statusColors[status]}`}>
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
          <Link to="/app/pipeline" className="flex items-center gap-4 p-4 transition-colors hover:bg-secondary/40">
            <img src={nextUp.thumbnail} alt="" className="size-[72px] shrink-0 rounded-xl object-cover" />
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium leading-snug">{nextUp.title}</p>
              <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                {nextUp.script ?? nextUp.description}
              </p>
            </div>
            <span className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-primary">
              {tr("dashboard.open")}
              <ArrowRight className="size-3.5" />
            </span>
          </Link>
        </Card>
      )}

      <Card className="!p-0 overflow-hidden">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h2 className="text-sm font-semibold">{tr("dashboard.recent")}</h2>
          <Link to="/app/pipeline" className="inline-flex items-center gap-1 text-xs font-semibold text-primary">
            {tr("dashboard.seePipeline")}
            <ArrowRight className="size-3.5" />
          </Link>
        </div>
        <ul className="flex flex-col">
          {recent.map((idea, i) => (
            <li key={idea.id}>
              <div className={`flex items-start gap-3.5 px-4 py-3.5 ${i > 0 ? "border-t border-border" : ""}`}>
                <img src={idea.thumbnail} alt="" className="size-11 shrink-0 rounded-lg object-cover" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium leading-snug">{idea.title}</p>
                  <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">{idea.description}</p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-xs font-medium text-muted-foreground">{tr(`status.${idea.status}`)}</p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground/75">{formatDate(idea.updatedAt, locale)}</p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
