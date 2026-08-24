import { demoIdeas, type Idea, type IdeaStatus } from "../data/demo";
import { useI18n } from "../i18n/context";

const columns: IdeaStatus[] = [
  "idea",
  "script",
  "production",
  "ready",
  "published",
];

const columnStyles: Record<IdeaStatus, string> = {
  idea: "border-status-idea/35",
  script: "border-status-script/40",
  production: "border-status-production/40",
  ready: "border-status-ready/40",
  published: "border-status-published/30",
};

const headerStyles: Record<IdeaStatus, string> = {
  idea: "text-status-idea",
  script: "text-status-script",
  production: "text-status-production",
  ready: "text-status-ready",
  published: "text-status-published",
};

export function PipelinePage() {
  const { tr } = useI18n();

  const grouped = columns.reduce(
    (acc, col) => {
      acc[col] = demoIdeas.filter((i) => i.status === col);
      return acc;
    },
    {} as Record<IdeaStatus, Idea[]>,
  );

  return (
    <div className="flex flex-col gap-4">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">{tr("pipeline.titlePage")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{tr("pipeline.subtitlePage")}</p>
      </header>

      <div className="flex gap-3 overflow-x-auto pb-2">
        {columns.map((col) => (
          <div
            key={col}
            className={`w-72 shrink-0 rounded-2xl border bg-card/50 p-3 shadow-card ${columnStyles[col]}`}
          >
            <div className="mb-3 flex items-center justify-between">
              <h2 className={`text-sm font-semibold ${headerStyles[col]}`}>
                {tr(`status.${col}`)}
              </h2>
              <span className="rounded-md bg-secondary px-2 py-0.5 text-xs font-medium">
                {grouped[col].length}
              </span>
            </div>
            <div className="flex flex-col gap-2">
              {grouped[col].map((idea) => (
                <article
                  key={idea.id}
                  className="overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-shadow hover:shadow-card"
                >
                  <img
                    src={idea.thumbnail}
                    alt=""
                    className="aspect-video w-full object-cover"
                    loading="lazy"
                  />
                  <div className="p-3">
                    <p className="line-clamp-2 text-sm font-medium">{idea.title}</p>
                    <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                      {idea.description}
                    </p>
                    <span className="mt-2 inline-block rounded-md bg-secondary px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide">
                      {idea.platform}
                    </span>
                  </div>
                </article>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
