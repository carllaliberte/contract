import { useI18n } from "../i18n/context";
import { useAiUsage } from "../hooks/useAiUsage";

export function AiUsageBadge({ className = "" }: { className?: string }) {
  const { tr } = useI18n();
  const usage = useAiUsage();

  return (
    <p className={`text-xs text-muted-foreground tabular-nums ${className}`}>
      {tr("script.quotaSummary", {
        shortRemaining: String(usage.short.remaining),
        shortLimit: String(usage.short.limit),
        longRemaining: String(usage.long.remaining),
        longLimit: String(usage.long.limit),
      })}
    </p>
  );
}
