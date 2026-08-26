import { ExternalLink, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { LanguageSelector } from "../components/LanguageSelector";
import { PaywallSheet } from "../components/PaywallSheet";
import { Button, Card } from "../components/ui";
import { useI18n } from "../i18n/context";
import { useAiUsage } from "../hooks/useAiUsage";
import { useAuth } from "../hooks/useAuth";
import { usePlan } from "../hooks/usePlan";
import { PRIVACY_POLICY_URL, SUPPORT_URL } from "../lib/appLinks";
import { getAppleProfile } from "../lib/auth/session";
import { checkApiHealth, resolveApiBaseUrl } from "../lib/api/health";
import { restorePurchases } from "../lib/iap";
import { PLAN_LIMITS } from "../lib/plans";
import { META_HOLDER_BONUS_AI } from "../lib/limits";
import { metaEntitlements } from "../../../shared/meta-entitlements";

export function SettingsPage() {
  const { tr } = useI18n();
  const plan = usePlan();
  const usage = useAiUsage();
  const { isAuthenticated, isDemo } = useAuth();
  const [paywallOpen, setPaywallOpen] = useState(false);
  const [restoreBusy, setRestoreBusy] = useState(false);
  const [restoreNotice, setRestoreNotice] = useState<string | null>(null);
  const [profileName, setProfileName] = useState("");
  const [profileEmail, setProfileEmail] = useState("");
  const [apiChecking, setApiChecking] = useState(false);
  const [apiOnline, setApiOnline] = useState<boolean | null>(null);
  const apiBaseUrl = resolveApiBaseUrl();

  const limits = PLAN_LIMITS[plan];
  const shortPct = limits.short
    ? Math.min(100, Math.round((usage.short.count / limits.short) * 100))
    : 0;
  const longPct = limits.long
    ? Math.min(100, Math.round((usage.long.count / limits.long) * 100))
    : 0;

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      if (isAuthenticated) {
        const profile = await getAppleProfile();
        if (cancelled) return;
        setProfileName(profile.displayName ?? tr("settings.appleUser"));
        setProfileEmail(profile.email ?? tr("settings.appleEmailHidden"));
        return;
      }
      if (isDemo) {
        setProfileName(tr("settings.demoName"));
        setProfileEmail(tr("settings.demoEmail"));
        return;
      }
      setProfileName(tr("settings.guestName"));
      setProfileEmail("");
    })();
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, isDemo, tr]);

  useEffect(() => {
    if (!apiBaseUrl) {
      setApiOnline(null);
      return;
    }
    let cancelled = false;
    setApiChecking(true);
    void checkApiHealth().then(({ online }) => {
      if (cancelled) return;
      setApiOnline(online);
      setApiChecking(false);
    });
    return () => {
      cancelled = true;
    };
  }, [apiBaseUrl]);

  async function handleRestore() {
    setRestoreBusy(true);
    setRestoreNotice(null);
    const result = await restorePurchases();
    setRestoreBusy(false);
    if (result.ok) {
      setRestoreNotice(
        result.activeProductId ? tr("paywall.restoreSuccess") : tr("paywall.restoreEmpty"),
      );
      return;
    }
    setRestoreNotice(
      result.reason === "unavailable"
        ? tr("paywall.nativeUnavailable")
        : result.message ?? tr("paywall.error"),
    );
  }

  const profileInitial = profileName.trim().charAt(0).toUpperCase() || "?";

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
            {profileInitial}
          </span>
          <div>
            <p className="font-medium">{profileName}</p>
            {profileEmail ? (
              <p className="text-sm text-muted-foreground">{profileEmail}</p>
            ) : null}
            <p className="mt-1 text-xs text-muted-foreground">
              {isAuthenticated
                ? tr("session.badge.apple")
                : isDemo
                  ? tr("demo.badge")
                  : tr("settings.guestName")}
            </p>
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

        <div className="mt-4 flex flex-col gap-2 border-t border-border pt-4">
          <Button
            type="button"
            variant="outline"
            className="h-10"
            disabled={restoreBusy}
            onClick={() => void handleRestore()}
          >
            {restoreBusy ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden />
                {tr("paywall.restoring")}
              </>
            ) : (
              tr("paywall.restore")
            )}
          </Button>
          {restoreNotice ? (
            <p className="text-xs text-muted-foreground">{restoreNotice}</p>
          ) : null}
        </div>
      </Card>

      <Card className="p-5">
        <h2 className="text-sm font-semibold">{tr("settings.apiTitle")}</h2>
        <div className="mt-3 flex items-center gap-2">
          {apiChecking ? (
            <>
              <Loader2 className="size-4 animate-spin text-muted-foreground" aria-hidden />
              <p className="text-sm text-muted-foreground">{tr("settings.apiChecking")}</p>
            </>
          ) : apiBaseUrl ? (
            <>
              <span
                className={`size-2.5 rounded-full ${apiOnline ? "bg-emerald-500" : "bg-destructive"}`}
                aria-hidden
              />
              <p className="text-sm">
                {apiOnline ? tr("settings.apiOnline") : tr("settings.apiOffline")}
              </p>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">{tr("settings.apiDemo")}</p>
          )}
        </div>
        {apiBaseUrl ? (
          <p className="mt-2 break-all text-xs text-muted-foreground">{apiBaseUrl}</p>
        ) : null}
      </Card>

      <Card className="p-5">
        <h2 className="text-sm font-semibold">{tr("settings.legalTitle")}</h2>
        <div className="mt-3 flex flex-col gap-2">
          <a
            href={PRIVACY_POLICY_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
          >
            {tr("settings.privacy")}
            <ExternalLink className="size-3.5" aria-hidden />
          </a>
          <a
            href={SUPPORT_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
          >
            {tr("settings.support")}
            <ExternalLink className="size-3.5" aria-hidden />
          </a>
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
