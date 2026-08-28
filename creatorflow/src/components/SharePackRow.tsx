import { Loader2 } from "lucide-react";
import { useState } from "react";
import { useIdeas } from "../context/IdeasContext";
import type { Idea } from "../data/demo";
import { useI18n } from "../i18n/context";
import { fetchGeneratedClip } from "../lib/api/generateClip";
import { sharePack, sharePackHasContent, type ShareDestination } from "../lib/sharePack";
import { Button } from "./ui";

type SharePackRowProps = {
  idea: Idea;
  className?: string;
};

export function SharePackRow({ idea, className }: SharePackRowProps) {
  const { tr, locale } = useI18n();
  const { moveIdea } = useIdeas();
  const [loadingDest, setLoadingDest] = useState<ShareDestination | null>(null);
  const [clipBusy, setClipBusy] = useState<6 | 15 | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [canMarkPublished, setCanMarkPublished] = useState(
    idea.status !== "published",
  );

  if (!sharePackHasContent(idea)) return null;

  async function handleShare(destination: ShareDestination) {
    setLoadingDest(destination);
    setNotice(
      destination === "x"
        ? locale === "fr"
          ? "Clip en cours…"
          : "Rendering clip…"
        : null,
    );
    const ok = await sharePack(idea, destination);
    setLoadingDest(null);
    setNotice(ok ? tr("share.success") : tr("share.failed"));
    if (ok && idea.status !== "published") setCanMarkPublished(true);
    window.setTimeout(() => setNotice(null), 4000);
  }

  async function handleClip(seconds: 6 | 15) {
    const hook = idea.packHooks?.[0]?.trim() || idea.title;
    const script =
      idea.script?.trim() || idea.packCaption?.trim() || idea.description.trim();
    setClipBusy(seconds);
    setNotice(null);
    const url = await fetchGeneratedClip(hook, seconds, script);
    setClipBusy(null);
    if (!url) {
      setNotice(locale === "fr" ? "Clip pas encore branché." : "Clip is not wired yet.");
      return;
    }
    window.open(url, "_blank", "noopener,noreferrer");
  }

  function handleMarkPublished() {
    moveIdea(idea.id, "published");
    setCanMarkPublished(false);
  }

  const busy = loadingDest !== null || clipBusy !== null;

  return (
    <div className={className}>
      <Button
        type="button"
        className="h-14 w-full rounded-full bg-foreground text-base font-semibold text-background hover:bg-foreground/90"
        disabled={busy}
        onClick={() => void handleShare("x")}
      >
        {loadingDest === "x" ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
        {tr("share.publishX")}
      </Button>
      <div className="mt-2 flex gap-2">
        <Button
          type="button"
          variant="outline"
          className="h-11 flex-1 text-sm"
          disabled={busy}
          onClick={() => void handleClip(6)}
        >
          {clipBusy === 6 ? <Loader2 className="size-3.5 animate-spin" aria-hidden /> : null}
          Clip 6s
        </Button>
        <Button
          type="button"
          variant="outline"
          className="h-11 flex-1 text-sm"
          disabled={busy}
          onClick={() => void handleClip(15)}
        >
          {clipBusy === 15 ? <Loader2 className="size-3.5 animate-spin" aria-hidden /> : null}
          Clip 15s
        </Button>
      </div>
      <div className="mt-2 flex gap-2">
        <Button
          type="button"
          variant="outline"
          className="h-11 flex-1 text-sm"
          disabled={busy}
          onClick={() => void handleShare("instagram")}
        >
          {loadingDest === "instagram" ? (
            <Loader2 className="size-3.5 animate-spin" aria-hidden />
          ) : null}
          {tr("share.instagram")}
        </Button>
        <Button
          type="button"
          variant="outline"
          className="h-11 flex-1 text-sm"
          disabled={busy}
          onClick={() => void handleShare("tiktok")}
        >
          {loadingDest === "tiktok" ? (
            <Loader2 className="size-3.5 animate-spin" aria-hidden />
          ) : null}
          {tr("share.tiktok")}
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
        <p className="mt-2 text-xs text-muted-foreground" role="status">
          {notice}
        </p>
      )}
    </div>
  );
}
