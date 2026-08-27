import { Loader2 } from "lucide-react";
import { useState } from "react";
import type { Idea } from "../data/demo";
import { useI18n } from "../i18n/context";
import {
  SHARE_DESTINATIONS,
  sharePack,
  type ShareDestination,
} from "../lib/sharePack";
import { Button } from "./ui";

type SharePackRowProps = {
  idea: Idea;
  className?: string;
  onShared?: () => void;
};

export function SharePackRow({ idea, className, onShared }: SharePackRowProps) {
  const { tr } = useI18n();
  const [loadingDest, setLoadingDest] = useState<ShareDestination | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  if (!buildSharePackHasContent(idea)) return null;

  async function handleShare(destination: ShareDestination) {
    setLoadingDest(destination);
    setNotice(null);
    const ok = await sharePack(idea, destination);
    setLoadingDest(null);
    setNotice(ok ? tr("share.success") : tr("share.failed"));
    if (ok) onShared?.();
    window.setTimeout(() => setNotice(null), 2500);
  }

  return (
    <div className={className}>
      <p className="mb-2 text-xs font-medium text-muted-foreground">{tr("share.pack")}</p>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {SHARE_DESTINATIONS.map((destination) => (
          <Button
            key={destination}
            type="button"
            variant={destination === "copy" ? "outline" : "primary"}
            className="h-11 min-w-[4.5rem] flex-1 text-xs"
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
      {notice && (
        <p className="mt-2 text-[11px] text-muted-foreground" role="status">
          {notice}
        </p>
      )}
    </div>
  );
}

function buildSharePackHasContent(idea: Idea): boolean {
  return Boolean(idea.script?.trim() || idea.description.trim());
}
