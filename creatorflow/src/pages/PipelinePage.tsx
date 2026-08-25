import { demoIdeas, type Idea, type IdeaStatus } from "../data/demo";
import { useI18n } from "../i18n/context";

const columns: IdeaStatus[] = ["idea", "script", "production", "ready", "published"];

const columnStyles: Record<IdeaStatus, string> = {
  idea: "border-status-idea/30",
  script: "border-status-script/35",
  production: "border-status-production/35",
  ready: "border-status-ready/35",
  published: "border-status-published/25",
};

const headerStyles: Record<IdeaStatus, string> = {
  idea: "text-status-idea",
  script: "text-status-script",
  production: "text-status-production",
  ready: "text-status-ready",
  published: "text-status-published",
};

const platformLabel: Record<string, string> = {
  youtube: "YouTube",
  tiktok: "TikTok",
  reels: "Reels",
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
    <div className="flex flex-col gap-5">
      <header className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{tr("pipeline.titlePage")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{tr("pipeline.subtitlePage")}</p>
        </div>
        <p className="text-xs text-muted-foreground">{demoIdeas.length} contenus · mode démo</p>
      </header>

      <div className="flex gap-3 overflow-x-auto pb-3 -mx-1 px-1">
        {columns.map((col) => (
          <div key={col} className={`w-[280px] shrink-0 rounded-2xl border bg-card/40 p-3.5 ${columnStyles[col]}`}>
            <div className="mb-3.5 flex items-center justify-between">
              <h2 className={`text-[13px] font-semibold uppercase tracking-wide ${headerStyles[col]}`}>
                {tr(`status.${col}`)}
              </h2>
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-secondary px-1.5 text-[11px] font-semibold tabular-nums">
                {grouped[col].length}
              </span>
            </div>

            <div className="flex flex-col gap-2.5">
              {grouped[col].length === 0 ? (
                <div className="rounded-xl border border-dashed border-border/60 py-8 text-center text-xs text-muted-foreground">
                  Aucun contenu
                </div>
              ) : (
                grouped[col].map((idea) => (
                  <article key={idea.id} className="pipeline-card group overflow-hidden rounded-xl border border-border bg-card">
                    <div className="relative aspect-[16/10] overflow-hidden">
                      <img
                        src={idea.thumbnail}
                        alt=""
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                        loading="lazy"
                      />
                      <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-black/50 to-transparent" />
                      <span className="absolute bottom-2 left-2 rounded-md bg-black/55 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-white backdrop-blur-sm">
                        {platformLabel[idea.platform] ?? idea.platform}
                      </span>
                    </div>
                    <div className="p-3">
                      <p className="line-clamp-2 text-[13px] font-medium leading-snug">{idea.title}</p>
                      <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-muted-foreground">{idea.description}</p>
                    </div>
                  </article>
                ))
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
