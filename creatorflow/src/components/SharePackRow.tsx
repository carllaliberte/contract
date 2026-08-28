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

const SECONDARY_DESTINATIONS = SHARE_DESTINATIONS.filter(
  (destination): destination is Exclude<ShareDestination, "x"> => destination !== "x",
);

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
      <Button
        type="button"
        className="h-14 w-full rounded-full bg-foreground text-base font-semibold text-background hover:bg-foreground/90"
        disabled={loadingDest !== null}
        onClick={() => void handleShare("x")}
      >
        {loadingDest === "x" ? (
          <Loader2 className="size-4 animate-spin" aria-hidden />
        ) : null}
        {tr("share.publishX")}
      </Button>
      <div className="mt-2 flex gap-2">
        {SECONDARY_DESTINATIONS.map((destination) => (
          <Button
            key={destination}
            type="button"
            variant="outline"
            className="h-11 flex-1 text-sm"
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
          className="mt-2 h-11 w-full text-sm"
          onClick={handleMarkPublished}
        >
          {tr("dashboard.nextAction.publish")}
        </Button>
      ) : null}
      {notice && (
        <p className="mt-2 text-xs text-muted-foreground" role="status">
          {notice}
        </p>
      )}
    </div>
  );
}
