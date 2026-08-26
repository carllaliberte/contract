import { Loader2, Pause, Volume2 } from "lucide-react";
import { useI18n } from "../i18n/context";
import { useTtsPlayback } from "../hooks/useTtsPlayback";
import { Button } from "./ui";

type TtsPlayButtonProps = {
  text: string;
  className?: string;
};

export function TtsPlayButton({ text, className }: TtsPlayButtonProps) {
  const { tr } = useI18n();
  const { fromCache, error, play, isLoading, isPlaying } = useTtsPlayback(text);

  const label = isLoading
    ? tr("tts.loading")
    : isPlaying
      ? tr("tts.pause")
      : fromCache
        ? tr("tts.playCached")
        : tr("tts.play");

  return (
    <div className={className}>
      <Button
        type="button"
        variant="secondary"
        className="h-9 w-full text-xs"
        disabled={!text.trim() || isLoading}
        onClick={() => void play()}
        aria-pressed={isPlaying}
      >
        {isLoading ? (
          <Loader2 className="size-3.5 animate-spin" aria-hidden />
        ) : isPlaying ? (
          <Pause className="size-3.5" aria-hidden />
        ) : (
          <Volume2 className="size-3.5" aria-hidden />
        )}
        {label}
      </Button>
      {error && (
        <p className="mt-1 text-[11px] text-destructive" role="alert">
          {tr("tts.error")}
        </p>
      )}
    </div>
  );
}
