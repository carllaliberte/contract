import { ArrowRight, Plus } from "lucide-react";
import { Link } from "react-router-dom";
import { Button, Card } from "../components/ui";
import {
  countByStatus,
  demoIdeas,
  getNextUp,
  type IdeaStatus,
} from "../data/demo";
import { useI18n } from "../i18n/context";

const statuses: IdeaStatus[] = [
  "idea",
  "script",
  "production",
  "ready",
  "published",
];

const statusColors: Record<IdeaStatus, string> = {
  idea: "bg-status-idea/15 text-status-idea",
  script: "bg-status-script/15 text-status-script",
  production: "bg-status-production/15 text-status-production",
  ready: "bg-status-ready/15 text-status-ready",
  published: "bg-status-published/15 text-status-published",
};

function formatDate(iso: string, locale: string) {
  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
  }).format(new Date(iso));
}

export function DashboardPage() {
  const { tr, locale } = useI18n();
  const counts = countByStatus(demoIdeas);
  const nextUp = getNextUp(demoIdeas);
  const recent = [...demoIdeas]
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, 4);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-5">
      <header className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            {tr("dashboard.hello", { name: "Alex" })}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">{tr("dashboard.subtitle")}</p>
        </div>
        <Button className="shrink-0">
          <Plus className="size-4" />
          {tr("dashboard.newIdea")}
        </Button>
      </header>

      <section className="grid grid-cols-5 gap-1.5 sm:gap-2">
        {statuses.map((status) => (
          <Link
            key={status}
            to="/app/pipeline"
            className="flex flex-col items-center gap-1 rounded-xl border border-border bg-card px-1 py-2.5 shadow-card transition-shadow hover:shadow-card-hover sm:px-2"
          >
            <span
              className={`grid size-7 place-items-center rounded-md text-xs font-bold ${statusColors[status]}`}
            >
              {counts[status] ?? 0}
            </span>
            <span className="text-[10px] font-medium text-muted-foreground sm:text-xs">
              {tr(`status.${status}`)}
            </span>
          </Link>
        ))}
      </section>

      {nextUp && (
        <Card>
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-sm font-semibold">{tr("dashboard.nextUp")}</h2>
            <span className="text-xs text-muted-foreground">
              {tr(`status.${nextUp.status}`)} · {tr(`priority.${nextUp.priority}`)}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <img
              src={nextUp.thumbnail}
              alt=""
              className="size-16 shrink-0 rounded-lg object-cover"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">{nextUp.title}</p>
              <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                {nextUp.script ?? nextUp.description}
              </p>
            </div>
            <span className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-primary">
              {tr("dashboard.open")}
              <ArrowRight className="size-3.5" />
            </span>
          </div>
        </Card>
      )}

      <Card>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-semibold">{tr("dashboard.recent")}</h2>
          <Link
            to="/app/pipeline"
            className="inline-flex items-center gap-1 text-xs font-medium text-primary"
          >
            {tr("dashboard.seePipeline")}
            <ArrowRight className="size-3.5" />
          </Link>
        </div>
        <ul className="flex flex-col">
          {recent.map((idea, i) => (
            <li key={idea.id} className={i > 0 ? "border-t border-border" : ""}>
              <div className="flex items-start gap-3 py-2.5">
                <img
                  src={idea.thumbnail}
                  alt=""
                  className="size-10 shrink-0 rounded-md object-cover"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{idea.title}</p>
                  <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                    {idea.description}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-xs font-medium text-muted-foreground">
                    {tr(`status.${idea.status}`)}
                  </p>
                  <p className="text-xs text-muted-foreground/80">
                    {formatDate(idea.updatedAt, locale)}
                  </p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
