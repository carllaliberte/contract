import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useIdeas } from "../context/IdeasContext";
import type { Idea } from "../data/demo";
import { useI18n } from "../i18n/context";
import {
  fetchGeneratedClip,
  peekGeneratedClipFile,
  prefetchGeneratedClip,
} from "../lib/api/generateClip";
import { sharePack, sharePackHasContent, type ShareDestination } from "../lib/sharePack";
import { Button } from "./ui";

type SharePackRowProps = {
  idea: Idea;
  className?: string;
};

function clipArgs(idea: Idea) {
  const hook = idea.packHooks?.[0]?.trim() || idea.title;
  const script =
    idea.script?.trim() || idea.packCaption?.trim() || idea.description.trim();
  return { hook, script };
}

export function SharePackRow({ idea, className }: SharePackRowProps) {
  const { tr, locale } = useI18n();
  const { moveIdea } = useIdeas();
  const [loadingDest, setLoadingDest] = useState<ShareDestination | null>(null);
  const [clipBusy, setClipBusy] = useState<6 | 15 | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [canMarkPublished, setCanMarkPublished] = useState(
    idea.status !== "published",
  );

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const { hook, script } = clipArgs(idea);

  useEffect(() => {
    if (!hook && !script) return;
    void prefetchGeneratedClip(hook, 6, script);
  }, [hook, script]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  if (!sharePackHasContent(idea)) return null;

  function showReadyClip() {
    const ready = peekGeneratedClipFile(hook, 6, script);
    if (!ready) return false;
    const url = URL.createObjectURL(ready);
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return url;
    });
    return true;
  }

  async function handleShare(destination: ShareDestination) {
    setLoadingDest(destination);
    setNotice(
      destination === "x"
        ? locale === "fr"
          ? "Clip en cours… le mp4 part sur X."
          : "Rendering the clip… the mp4 goes to X."
        : null,
    );
    const ok = await sharePack(idea, destination);
    setLoadingDest(null);
    if (ok) {
      setNotice(tr("share.success"));
      if (idea.status !== "published") setCanMarkPublished(true);
    } else if (destination === "x" && showReadyClip()) {
      setNotice(
        locale === "fr"
          ? "Clip prêt. Appuie encore sur Publier sur X."
          : "Clip ready. Tap Publish on X again to send it.",
      );
    } else {
      setNotice(destination === "x" ? tr("share.clipMissing") : tr("share.failed"));
    }
    window.setTimeout(() => setNotice(null), 6000);
  }

  async function handleClip(seconds: 6 | 15) {
    const { hook, script } = clipArgs(idea);
    setClipBusy(seconds);
    setNotice(null);
    const url = await fetchGeneratedClip(hook, seconds, script);
    setClipBusy(null);
    if (!url) {
      setNotice(locale === "fr" ? "Clip pas encore branché." : "Clip is not wired yet.");
      return;
    }
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return url;
    });
  }

  function handleMarkPublished() {
    moveIdea(idea.id, "published");
    setCanMarkPublished(false);
  }

  const busy = loadingDest !== null || clipBusy !== null;

  return (
    <div className={className}>
      {previewUrl ? (
        <video
          src={previewUrl}
          className="mb-3 w-full rounded-2xl bg-black"
          style={{ aspectRatio: "9 / 16", maxHeight: 420 }}
          playsInline
          muted
          autoPlay
          loop
          controls
        />
      ) : null}
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
