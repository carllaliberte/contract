import { useI18n } from "../i18n/context";
import { useAiUsage } from "../hooks/useAiUsage";

export function AiUsageBadge({ className = "" }: { className?: string }) {
  const { tr } = useI18n();
  const usage = useAiUsage();

  return (
    <p className={`text-xs text-muted-foreground tabular-nums ${className}`}>
      {tr("script.aiRemaining", { n: String(usage.remaining) })}
      <span className="text-muted-foreground/70"> / {usage.limit}</span>
    </p>
  );
}
