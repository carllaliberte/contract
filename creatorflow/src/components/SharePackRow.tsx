import { Loader2 } from "lucide-react";
import { useState } from "react";
import { useIdeas } from "../context/IdeasContext";
import type { Idea } from "../data/demo";
import { useI18n } from "../i18n/context";
import {
  SHARE_DESTINATIONS,
  sharePack,
  sharePackHasContent,
  type ShareDestination,
} from "../lib/sharePack";
import { Button } from "./ui";

type SharePackRowProps = {
  idea: Idea;
  className?: string;
};

export function SharePackRow({ idea, className }: SharePackRowProps) {
  const { tr } = useI18n();
  const { moveIdea } = useIdeas();
  const [loadingDest, setLoadingDest] = useState<ShareDestination | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [canMarkPublished, setCanMarkPublished] = useState(
    idea.status !== "published",
  );

  if (!sharePackHasContent(idea)) return null;

  async function handleShare(destination: ShareDestination) {
    setLoadingDest(destination);
    setNotice(null);
    const ok = await sharePack(idea, destination);
    setLoadingDest(null);
    setNotice(ok ? tr("share.success") : tr("share.failed"));
    if (ok && idea.status !== "published") setCanMarkPublished(true);
    window.setTimeout(() => setNotice(null), 4000);
  }

  function handleMarkPublished() {
    moveIdea(idea.id, "published");
    setCanMarkPublished(false);
    setNotice(tr("dashboard.nextAction.publish"));
  }

  return (
    <div className={className}>
      <p className="mb-2 text-xs font-medium text-muted-foreground">{tr("share.pack")}</p>
      <div className="flex gap-2">
        {SHARE_DESTINATIONS.map((destination) => (
          <Button
            key={destination}
            type="button"
            variant="outline"
            className="h-8 flex-1 text-xs"
            disabled={loadingDest !== null}
            onClick={() => void handleShare(destination)}
          >
            {loadingDest === destination ? (
              <Loader2 className="size-3.5 animate-spin" aria-hidden />
            ) : null}
            {tr(`share.${destination}`)}
          </Button>
        ))}
      </div>
      {canMarkPublished && idea.status !== "published" ? (
        <Button
          type="button"
          variant="secondary"
          className="mt-2 h-8 w-full text-xs"
          onClick={handleMarkPublished}
        >
          {tr("dashboard.nextAction.publish")}
        </Button>
      ) : null}
      {notice && (
        <p className="mt-2 text-[11px] text-muted-foreground" role="status">
          {notice}
        </p>
      )}
    </div>
  );
}
