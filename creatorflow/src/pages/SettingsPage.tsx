import { useState } from "react";
import { LanguageSelector } from "../components/LanguageSelector";
import { PaywallSheet } from "../components/PaywallSheet";
import { Button, Card } from "../components/ui";
import { useI18n } from "../i18n/context";
import { useAiUsage } from "../hooks/useAiUsage";
import { usePlan } from "../hooks/usePlan";
import { PLAN_LIMITS } from "../lib/plans";
import { META_HOLDER_BONUS_AI } from "../lib/limits";
import { metaEntitlements } from "../../../shared/meta-entitlements";

export function SettingsPage() {
  const { tr } = useI18n();
  const plan = usePlan();
  const usage = useAiUsage();
  const [paywallOpen, setPaywallOpen] = useState(false);

  const limits = PLAN_LIMITS[plan];
  const shortPct = limits.short
    ? Math.min(100, Math.round((usage.short.count / limits.short) * 100))
    : 0;
  const longPct = limits.long
    ? Math.min(100, Math.round((usage.long.count / limits.long) * 100))
    : 0;

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">{tr("settings.title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{tr("settings.subtitle")}</p>
      </header>

      <Card className="p-5">
        <h2 className="text-sm font-semibold">{tr("lang.label")}</h2>
        <div className="mt-3">
          <LanguageSelector />
        </div>
      </Card>

      <Card className="p-5">
        <h2 className="text-sm font-semibold">{tr("settings.profile")}</h2>
        <div className="mt-4 flex items-center gap-4">
          <span className="grid size-14 place-items-center rounded-full bg-primary text-lg font-bold text-primary-foreground">
            A
          </span>
          <div>
            <p className="font-medium">Alex Créateur</p>
            <p className="text-sm text-muted-foreground">alex@demo.creatorflow.app</p>
          </div>
        </div>
      </Card>

      <Card className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold">{tr("settings.planTitle")}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {plan === "pro" ? tr("plan.proName") : tr("plan.freeName")}
            </p>
          </div>
          {plan === "free" && (
            <Button type="button" className="h-9 px-3 text-xs" onClick={() => setPaywallOpen(true)}>
              {tr("paywall.upgrade")}
            </Button>
          )}
        </div>

        <div className="mt-4 space-y-4">
          <div>
            <div className="mb-1 flex justify-between text-xs text-muted-foreground">
              <span>{tr("script.formatShort")}</span>
              <span className="tabular-nums">
                {usage.short.count} / {limits.short}
              </span>
            </div>
            <div className="video-progress">
              <div className="video-progress-bar" style={{ width: `${shortPct}%` }} />
            </div>
          </div>
          <div>
            <div className="mb-1 flex justify-between text-xs text-muted-foreground">
              <span>{tr("script.formatLong")}</span>
              <span className="tabular-nums">
                {usage.long.count} / {limits.long}
              </span>
            </div>
            <div className="video-progress">
              <div className="video-progress-bar" style={{ width: `${longPct}%` }} />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            {tr("plan.longMaxHint", { minutes: String(limits.maxLongMinutes) })}
          </p>
        </div>
      </Card>

      <Card className="p-5">
        <h2 className="text-sm font-semibold">META (utilitaire)</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Jeton utilitaire pour l&apos;écosystème — pas un produit d&apos;investissement. À terme :
          wallet connecté + solde ≥ {metaEntitlements.thresholds.holder} META → +{META_HOLDER_BONUS_AI}{" "}
          générations IA / mois (bonus holder). Pro iOS via achat in-app (IAP).
        </p>
        <p className="mt-2 text-xs text-muted-foreground">{metaEntitlements.disclaimer.fr}</p>
      </Card>

      <PaywallSheet open={paywallOpen} onClose={() => setPaywallOpen(false)} />
    </div>
  );
}
