import { Loader2, RotateCcw, Sparkles } from "lucide-react";
import { useState } from "react";
import { Button, Card } from "./ui";
import { useI18n } from "../i18n/context";
import { useAiContext } from "../hooks/useAiContext";
import {
  buildPromptContext,
  updateStyleFromPackage,
} from "../services/aiContext";

/**
 * Example integration of the AIContext / StyleMemory layer.
 *
 * - Toggle "Utiliser mon style"
 * - Preview learned preferences
 * - Reset memory
 * - Demo: learn from a sample content package
 */
export function StyleMemoryPanel() {
  const { tr } = useI18n();
  const { context, loading, toggleStyleMemory, resetMemory } = useAiContext();
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  if (loading || !context) {
    return (
      <Card className="flex items-center gap-2 p-5 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" aria-hidden />
        {tr("styleMemory.loading")}
      </Card>
    );
  }

  const { styleProfile, useStyleMemory } = context;
  const topVoices = Object.values(styleProfile.preferredVoices)
    .sort((a, b) => b.usageCount - a.usageCount)
    .slice(0, 3);

  async function handleToggle() {
    setBusy(true);
    setNotice(null);
    await toggleStyleMemory(!useStyleMemory);
    setBusy(false);
  }

  async function handleReset() {
    setBusy(true);
    setNotice(null);
    await resetMemory();
    setPreview(null);
    setNotice(tr("styleMemory.resetDone"));
    setBusy(false);
  }

  async function handlePreviewPrompt() {
    setBusy(true);
    const prompt = await buildPromptContext();
    setPreview(prompt.text || tr("styleMemory.previewEmpty"));
    setBusy(false);
  }

  async function handleLearnDemo() {
    setBusy(true);
    setNotice(null);
    await updateStyleFromPackage({
      id: crypto.randomUUID(),
      platform: "tiktok",
      tones: ["énergique", "direct"],
      script:
        "Stop scrolling ! Voici 3 astuces pour accrocher en 3 secondes. Aujourd'hui on apprend à structurer un hook irrésistible.",
      voiceId: "demo-voice-1",
      voiceName: "Léa (FR)",
      structure: { strongHook: 0.9, shortFormOptimized: 0.85 },
      successful: true,
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
        <label className="flex shrink-0 items-center gap-2 text-xs font-medium">
          <input
            type="checkbox"
            className="size-4 rounded border-border"
            checked={useStyleMemory}
            disabled={busy}
            onChange={() => void handleToggle()}
          />
          {tr("styleMemory.toggle")}
        </label>
      </div>

      <dl className="mt-4 grid gap-2 text-xs text-muted-foreground">
        <div className="flex justify-between gap-2">
          <dt>{tr("styleMemory.tones")}</dt>
          <dd className="text-right text-foreground">
            {styleProfile.preferredTones.length
              ? styleProfile.preferredTones.join(", ")
              : "—"}
          </dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt>{tr("styleMemory.platforms")}</dt>
          <dd className="text-right text-foreground">
            {styleProfile.preferredPlatforms.length
              ? styleProfile.preferredPlatforms.join(", ")
              : "—"}
          </dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt>{tr("styleMemory.voices")}</dt>
          <dd className="text-right text-foreground">
            {topVoices.length ? topVoices.map((v) => v.voiceName).join(", ") : "—"}
          </dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt>{tr("styleMemory.updated")}</dt>
          <dd className="text-right text-foreground">
            {new Date(styleProfile.lastUpdatedAt).toLocaleString()}
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
          onClick={() => void handlePreviewPrompt()}
        >
          {tr("styleMemory.preview")}
        </Button>
        <Button
          type="button"
          variant="outline"
          className="h-10 flex-1 text-xs"
          disabled={busy || !useStyleMemory}
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
