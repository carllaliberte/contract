import { Loader2, Sparkles, X } from "lucide-react";
import { useEffect, useState } from "react";
import type { Idea } from "../data/demo";
import { useI18n } from "../i18n/context";
import { usePlan } from "../hooks/usePlan";
import {
  allowedLongDurations,
  defaultLongDuration,
  type LongDuration,
  type ScriptFormat,
} from "../lib/plans";
import { canUseAiGeneration } from "../lib/aiUsage";
import { useAiUsage } from "../hooks/useAiUsage";
import { Button } from "./ui";

export function parseUserSource(raw: string): {
  sourceUrl?: string;
  sourceText?: string;
} {
  const t = raw.trim();
  if (!t) return {};
  const first = t.split(/\s/, 1)[0] ?? "";
  if (/^https?:\/\//i.test(first)) {
    const rest = t.slice(first.length).trim();
    return { sourceUrl: first, sourceText: rest || undefined };
  }
  return { sourceText: t };
}

export type ScriptGenerateOptions = {
  format: ScriptFormat;
  durationMinutes?: LongDuration;
  sourceUrl?: string;
  sourceText?: string;
};

type ScriptGenerateDialogProps = {
  idea: Idea | null;
  open: boolean;
  onClose: () => void;
  onSubmit: (idea: Idea, options: ScriptGenerateOptions) => Promise<void>;
  isGenerating?: boolean;
  onPaywall?: (format: ScriptFormat) => void;
};

export function ScriptGenerateDialog({
  idea,
  open,
  onClose,
  onSubmit,
  isGenerating,
  onPaywall,
}: ScriptGenerateDialogProps) {
  const { tr } = useI18n();
  const plan = usePlan();
  const usage = useAiUsage();
  const [format, setFormat] = useState<ScriptFormat>("short");
  const [duration, setDuration] = useState<LongDuration>(() => defaultLongDuration(plan));
  const [sourceRaw, setSourceRaw] = useState("");

  const durations = allowedLongDurations(plan);
  const isXPlatform = idea?.platform === "x";
  const shortAtQuota = usage.short.remaining <= 0;
  const longAtQuota = usage.long.remaining <= 0;
  const formatAtQuota = format === "short" ? shortAtQuota : longAtQuota;

  useEffect(() => {
    if (!open) return;
    setFormat("short");
    setDuration(defaultLongDuration(plan));
    setSourceRaw("");
  }, [open, idea?.id, plan]);

  useEffect(() => {
    if (isXPlatform && format === "long") {
      setFormat("short");
    }
  }, [isXPlatform, format]);

  useEffect(() => {
    if (!durations.includes(duration)) {
      setDuration(durations[durations.length - 1] ?? 8);
    }
  }, [duration, durations]);

  if (!open || !idea) return null;

  function selectFormat(value: ScriptFormat) {
    if (!canUseAiGeneration(value)) {
      onPaywall?.(value);
      return;
    }
    setFormat(value);
  }

  async function handleSubmit() {
    if (!canUseAiGeneration(format)) {
      onPaywall?.(format);
      return;
    }
    await onSubmit(idea!, {
      format,
      durationMinutes: format === "long" ? duration : undefined,
      ...parseUserSource(sourceRaw),
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="script-generate-title"
    >
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-5 shadow-card-hover">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 id="script-generate-title" className="text-lg font-semibold">
              {tr("script.dialogTitle")}
            </h2>
            <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{idea.title}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground"
            aria-label={tr("script.dialogClose")}
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="space-y-4">
          {!isXPlatform && (
          <div>
            <p className="mb-2 text-sm font-medium">{tr("script.formatLabel")}</p>
            <div className="grid grid-cols-2 gap-2">
              {(["short", "long"] as const).map((value) => {
                const disabled = value === "short" ? shortAtQuota : longAtQuota;
                return (
                <button
                  key={value}
                  type="button"
                  onClick={() => selectFormat(value)}
                  className={`rounded-xl border px-3 py-2.5 text-sm font-medium transition-colors ${
                    format === value
                      ? "border-primary bg-primary/15 text-primary"
                      : disabled
                        ? "cursor-not-allowed border-border/60 bg-secondary/20 text-muted-foreground/60"
                        : "border-border bg-secondary/40 text-muted-foreground hover:bg-secondary"
                  }`}
                >
                  {tr(value === "short" ? "script.formatShort" : "script.formatLong")}
                </button>
              );
              })}
            </div>
          </div>
          )}

          {isXPlatform && (
            <p className="text-sm text-muted-foreground">{tr("script.xFormatHint")}</p>
          )}

          {format === "long" && !isXPlatform && (
            <div>
              <p className="mb-2 text-sm font-medium">{tr("script.durationLabel")}</p>
              <div className="grid grid-cols-4 gap-2">
                {durations.map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setDuration(value)}
                    className={`rounded-xl border px-2 py-2 text-sm font-medium tabular-nums transition-colors ${
                      duration === value
                        ? "border-primary bg-primary/15 text-primary"
                        : "border-border bg-secondary/40 text-muted-foreground hover:bg-secondary"
                    }`}
                  >
                    {tr("script.durationMinutes", { n: String(value) })}
                  </button>
                ))}
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                {tr("script.longStructureHint")}
              </p>
            </div>
          )}

          <p className="text-xs text-muted-foreground">
            {format === "short"
              ? tr("script.quotaShortRemaining", {
                  n: String(usage.short.remaining),
                  limit: String(usage.short.limit),
                })
              : tr("script.quotaLongRemaining", {
                  n: String(usage.long.remaining),
                  limit: String(usage.long.limit),
                })}
          </p>

          <div>
            <label htmlFor="script-source" className="mb-2 block text-sm font-medium">
              {tr("script.sourceLabel")}
            </label>
            <textarea
              id="script-source"
              value={sourceRaw}
              onChange={(e) => setSourceRaw(e.target.value)}
              rows={3}
              placeholder={tr("script.sourcePlaceholder")}
              className="w-full resize-y rounded-xl border border-border bg-secondary/40 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
            />
            <p className="mt-1.5 text-xs text-muted-foreground">{tr("script.sourceHint")}</p>
          </div>
        </div>

        <div className="mt-5 flex gap-2">
          <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
            {tr("idea.cancel")}
          </Button>
          <Button
            type="button"
            className="flex-1"
            disabled={isGenerating || formatAtQuota}
            onClick={() => void handleSubmit()}
          >
            {isGenerating ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden />
                {tr("script.generating")}
              </>
            ) : (
              <>
                <Sparkles className="size-4" />
                {tr("script.generate")}
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
