import { Loader2 } from "lucide-react";
import { useState } from "react";
import { useIdeas } from "../context/IdeasContext";
import type { Idea } from "../data/demo";
import { useI18n } from "../i18n/context";
import {
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
  const { tr, locale } = useI18n();
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
  }

  const publishX =
    locale === "fr" ? "Publier sur X" : "Publish on X";

  return (
    <div className={className}>
      <Button
        type="button"
        className="h-14 w-full rounded-full bg-white text-base font-semibold text-black hover:bg-white/90"
        disabled={loadingDest !== null}
        onClick={() => void handleShare("x")}
      >
        {loadingDest === "x" ? (
          <Loader2 className="size-4 animate-spin" aria-hidden />
        ) : null}
        {publishX}
      </Button>
      <div className="mt-2 flex gap-2">
        <Button
          type="button"
          variant="outline"
          className="h-10 flex-1 text-xs"
          disabled={loadingDest !== null}
          onClick={() => void handleShare("instagram")}
        >
          {loadingDest === "instagram" ? (
            <Loader2 className="size-3.5 animate-spin" aria-hidden />
          ) : null}
          Instagram
        </Button>
        <Button
          type="button"
          variant="outline"
          className="h-10 flex-1 text-xs"
          disabled={loadingDest !== null}
          onClick={() => void handleShare("tiktok")}
        >
          {loadingDest === "tiktok" ? (
            <Loader2 className="size-3.5 animate-spin" aria-hidden />
          ) : null}
          TikTok
        </Button>
      </div>
      {canMarkPublished && idea.status !== "published" ? (
        <button
          type="button"
          className="mt-3 w-full text-center text-xs text-muted-foreground"
          onClick={handleMarkPublished}
        >
          {tr("dashboard.nextAction.publish")}
        </button>
      ) : null}
      {notice && (
        <p className="mt-2 text-[11px] text-muted-foreground" role="status">
          {notice}
        </p>
      )}
    </div>
  );
}
