import { RotateCcw, Sparkles } from "lucide-react";
import { useState } from "react";
import { Button, Card } from "./ui";
import { useI18n } from "../i18n/context";
import { useAIContext, useStyleProfile } from "../hooks/useAIContext";
import { aiContext } from "../services/aiContext";

/**
 * Example integration of the AIContext / StyleMemory layer (main API).
 *
 * - Preview learned preferences
 * - Reset memory
 * - Demo: learn from a sample content package
 */
export function StyleMemoryPanel() {
  const { tr, locale } = useI18n();
  const profile = useStyleProfile();
  const context = useAIContext({ language: locale, includeMemory: true });
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function handleReset() {
    setBusy(true);
    setNotice(null);
    aiContext.resetStyleProfile();
    setPreview(null);
    setNotice(tr("styleMemory.resetDone"));
    setBusy(false);
  }

  function handlePreviewPrompt() {
    setPreview(context.stylePrompt || tr("styleMemory.previewEmpty"));
  }

  async function handleLearnDemo() {
    setBusy(true);
    setNotice(null);
    aiContext.updateStyleFromPackage({
      platform: "tiktok",
      language: locale,
      format: "short",
      script: [
        "HOOK: Stop scrolling ! Voici 3 astuces pour accrocher en 3 secondes.",
        "POINT 1: Ouvre avec une question choc",
        "POINT 2: Montre le résultat avant la méthode",
        "CTA: Abonne-toi pour la suite.",
      ].join("\n"),
      source: "accepted",
    });
    setNotice(tr("styleMemory.learnDone"));
    setBusy(false);
  }

  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-sm font-semibold">
            <Sparkles className="size-4 text-primary" aria-hidden />
            {tr("styleMemory.title")}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">{tr("styleMemory.subtitle")}</p>
        </div>
      </div>

      <dl className="mt-4 grid gap-2 text-xs text-muted-foreground">
        <div className="flex justify-between gap-2">
          <dt>{tr("styleMemory.tones")}</dt>
          <dd className="text-right text-foreground">{profile.tone}</dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt>{tr("styleMemory.samples")}</dt>
          <dd className="text-right text-foreground">{profile.sampleCount}</dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt>{tr("styleMemory.voices")}</dt>
          <dd className="text-right text-foreground">
            {profile.tts.voiceId} ({profile.tts.speed}x)
          </dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt>{tr("styleMemory.updated")}</dt>
          <dd className="text-right text-foreground">
            {new Date(profile.updatedAt).toLocaleString()}
          </dd>
        </div>
      </dl>

      {preview ? (
        <pre className="mt-4 max-h-40 overflow-auto rounded-xl bg-secondary/60 p-3 text-[11px] leading-relaxed whitespace-pre-wrap">
          {preview}
        </pre>
      ) : null}

      {notice ? <p className="mt-3 text-xs text-muted-foreground">{notice}</p> : null}

      <div className="mt-4 flex flex-col gap-2 border-t border-border pt-4 sm:flex-row">
        <Button
          type="button"
          variant="outline"
          className="h-10 flex-1 text-xs"
          disabled={busy}
          onClick={handlePreviewPrompt}
        >
          {tr("styleMemory.preview")}
        </Button>
        <Button
          type="button"
          variant="outline"
          className="h-10 flex-1 text-xs"
          disabled={busy}
          onClick={() => void handleLearnDemo()}
        >
          {tr("styleMemory.learnDemo")}
        </Button>
        <Button
          type="button"
          variant="outline"
          className="h-10 flex-1 text-xs"
          disabled={busy}
          onClick={() => void handleReset()}
        >
          <RotateCcw className="size-3.5" aria-hidden />
          {tr("styleMemory.reset")}
        </Button>
      </div>
    </Card>
  );
}
