import { Play } from "lucide-react";
import { demoIdeas } from "../data/demo";
import { useI18n } from "../i18n/context";

export function ContentsPage() {
  const { tr } = useI18n();
  const withMedia = demoIdeas.filter((i) => i.videoUrl || i.script);

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">{tr("contents.title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{tr("contents.subtitle")}</p>
      </header>

      <div className="grid gap-6 sm:grid-cols-2">
        {withMedia.map((item) => (
          <article
            key={item.id}
            className="overflow-hidden rounded-2xl border border-border bg-card shadow-card"
          >
            <div className="relative aspect-video bg-black">
              {item.videoUrl ? (
                <video
                  className="size-full object-cover"
                  controls
                  playsInline
                  poster={item.thumbnail}
                  preload="metadata"
                >
                  <source src={item.videoUrl} type="video/mp4" />
                </video>
              ) : (
                <img src={item.thumbnail} alt="" className="size-full object-cover" />
              )}
              <span className="absolute left-3 top-3 rounded-md bg-black/60 px-2 py-0.5 text-xs font-medium text-white backdrop-blur-sm">
                {tr(`status.${item.status}`)}
              </span>
            </div>
            <div className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h2 className="font-medium">{item.title}</h2>
                  <p className="mt-1 text-xs uppercase tracking-wide text-muted-foreground">
                    {item.platform}
                  </p>
                </div>
                {item.videoUrl && (
                  <Play className="size-5 shrink-0 text-primary" aria-hidden />
                )}
              </div>
              {item.script && (
                <p className="mt-3 line-clamp-3 rounded-lg bg-secondary/50 p-3 text-xs leading-relaxed text-muted-foreground">
                  {item.script}
                </p>
              )}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
