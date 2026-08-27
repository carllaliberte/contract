import { Check, X } from "lucide-react";
import type { ReactNode } from "react";
import type { ContentPackage } from "../types/aiContext";
import type { Idea } from "../data/demo";
import { useI18n } from "../i18n/context";
import { Button } from "./ui";

type PackApplyDialogProps = {
  idea: Idea | null;
  pack: ContentPackage | null;
  open: boolean;
  providerLabel?: string;
  onClose: () => void;
  onApply: (idea: Idea, pack: ContentPackage) => Promise<void>;
  isApplying?: boolean;
};

function PackSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="mt-3">
      <p className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
        {title}
      </p>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}

export function PackApplyDialog({
  idea,
  pack,
  open,
  providerLabel,
  onClose,
  onApply,
  isApplying,
}: PackApplyDialogProps) {
  const { tr } = useI18n();

  if (!open || !idea || !pack) return null;

  const titles = pack.titles?.filter(Boolean) ?? [];
  const hooks = pack.hooks?.filter(Boolean) ?? [];
  const hashtags = pack.hashtags?.filter(Boolean) ?? [];
  const caption = pack.description?.trim() ?? "";

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pack-apply-title"
    >
      <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-5 shadow-card-hover">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 id="pack-apply-title" className="text-base font-semibold">
              {tr("pack.previewTitle")}
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">{idea.title}</p>
            {providerLabel && (
              <p className="mt-1 text-[11px] text-muted-foreground">
                {tr("pack.providerVia", { provider: providerLabel })}
              </p>
            )}
          </div>
          <button
            type="button"
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-secondary"
            aria-label={tr("pack.discard")}
            onClick={onClose}
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="mt-3 max-h-[min(28rem,60vh)] overflow-auto pr-1">
          <PackSection title={tr("pack.script")}>
            <pre className="rounded-xl bg-secondary/50 p-3 text-xs leading-relaxed whitespace-pre-wrap text-foreground">
              {pack.script}
            </pre>
          </PackSection>

          {hooks.length > 0 && (
            <PackSection title={tr("pack.hooks")}>
              <ol className="space-y-1.5 text-xs">
                {hooks.map((hook, index) => (
                  <li
                    key={`${index}-${hook}`}
                    className="rounded-lg bg-secondary/40 px-3 py-2"
                  >
                    {hook}
                  </li>
                ))}
              </ol>
            </PackSection>
          )}

          {titles.length > 0 && (
            <PackSection title={tr("pack.titles")}>
              <ol className="list-decimal space-y-1 pl-4 text-xs">
                {titles.map((title) => (
                  <li key={title}>{title}</li>
                ))}
              </ol>
            </PackSection>
          )}

          {caption ? (
            <PackSection title={tr("pack.description")}>
              <p className="text-xs leading-relaxed">{caption}</p>
            </PackSection>
          ) : null}

          {hashtags.length > 0 && (
            <PackSection title={tr("pack.hashtags")}>
              <p className="text-xs text-muted-foreground">{hashtags.join(" ")}</p>
            </PackSection>
          )}
        </div>

        <div className="mt-4 flex gap-2">
          <Button
            type="button"
            variant="outline"
            className="h-10 flex-1"
            disabled={isApplying}
            onClick={onClose}
          >
            {tr("pack.discard")}
          </Button>
          <Button
            type="button"
            className="h-10 flex-1"
            disabled={isApplying}
            onClick={() => void onApply(idea, pack)}
          >
            <Check className="size-4" />
            {isApplying ? tr("pack.applying") : tr("pack.apply")}
          </Button>
        </div>
      </div>
    </div>
  );
}