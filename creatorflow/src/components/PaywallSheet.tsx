import { Check, Loader2, X } from "lucide-react";
import { useState } from "react";
import { useI18n } from "../i18n/context";
import { usePlan } from "../hooks/usePlan";
import { PLAN_LIMITS } from "../lib/plans";
import {
  IAP_CATALOG,
  IAP_PRODUCT_IDS,
  isIapNativeBridgeAvailable,
  purchaseProduct,
  restorePurchases,
  type IapProductId,
} from "../lib/iap";
import { Button } from "./ui";

type PaywallSheetProps = {
  open: boolean;
  onClose: () => void;
};

const PRO_FEATURES = [
  "paywall.featureShort",
  "paywall.featureLong",
  "paywall.featureDuration",
] as const;

export function PaywallSheet({ open, onClose }: PaywallSheetProps) {
  const { tr } = useI18n();
  const plan = usePlan();
  const [selected, setSelected] = useState<IapProductId>(IAP_PRODUCT_IDS.monthly);
  const [busy, setBusy] = useState<"purchase" | "restore" | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  if (!open) return null;

  const nativeReady = isIapNativeBridgeAvailable();

  async function handlePurchase() {
    setBusy("purchase");
    setNotice(null);
    const result = await purchaseProduct(selected);
    setBusy(null);
    if (result.ok) {
      onClose();
      return;
    }
    if (result.reason === "unavailable") {
      setNotice(tr("paywall.nativeUnavailable"));
    } else if (result.reason === "cancelled") {
      setNotice(tr("paywall.cancelled"));
    } else {
      setNotice(result.message ?? tr("paywall.error"));
    }
  }

  async function handleRestore() {
    setBusy("restore");
    setNotice(null);
    const result = await restorePurchases();
    setBusy(null);
    if (result.ok) {
      if (result.activeProductId) {
        setNotice(tr("paywall.restoreSuccess"));
        onClose();
      } else {
        setNotice(tr("paywall.restoreEmpty"));
      }
      return;
    }
    setNotice(
      result.reason === "unavailable"
        ? tr("paywall.nativeUnavailable")
        : result.message ?? tr("paywall.error"),
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/65 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="paywall-title"
    >
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-5 shadow-card-hover">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-primary">
              {nativeReady ? tr("paywall.badge") : tr("plan.freeName")}
            </p>
            <h2 id="paywall-title" className="mt-1 text-xl font-semibold">
              {nativeReady ? tr("paywall.title") : tr("plan.freeName")}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {nativeReady ? tr("paywall.subtitle") : tr("paywall.stubNote")}
            </p>
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

        {plan === "free" && (
          <p className="mb-4 text-sm text-muted-foreground">
            {tr("paywall.currentFree", {
              short: String(PLAN_LIMITS.free.short),
              long: String(PLAN_LIMITS.free.long),
            })}
          </p>
        )}

        {nativeReady ? (
          <>
            <ul className="mb-4 space-y-2">
              {PRO_FEATURES.map((key) => (
                <li key={key} className="flex items-start gap-2 text-sm">
                  <Check className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
                  <span>{tr(key)}</span>
                </li>
              ))}
            </ul>

            <div className="mb-4 grid gap-2">
              {(Object.keys(IAP_CATALOG) as IapProductId[]).map((productId) => {
                const item = IAP_CATALOG[productId];
                const label =
                  productId === IAP_PRODUCT_IDS.monthly
                    ? tr("paywall.monthly")
                    : tr("paywall.yearly");
                return (
                  <button
                    key={productId}
                    type="button"
                    onClick={() => setSelected(productId)}
                    className={`flex items-center justify-between rounded-xl border px-4 py-3 text-left transition-colors ${
                      selected === productId
                        ? "border-primary bg-primary/10"
                        : "border-border bg-secondary/30 hover:bg-secondary/60"
                    }`}
                  >
                    <p className="text-sm font-semibold">{label}</p>
                    <p className="text-sm font-semibold tabular-nums">
                      {tr("paywall.priceCad", { price: item.displayPrice })}
                      <span className="text-xs font-normal text-muted-foreground">
                        {productId === IAP_PRODUCT_IDS.monthly
                          ? tr("paywall.perMonth")
                          : tr("paywall.perYear")}
                      </span>
                    </p>
                  </button>
                );
              })}
            </div>
          </>
        ) : null}

        {notice && (
          <p className="mb-3 rounded-lg border border-border bg-secondary/50 px-3 py-2 text-xs text-muted-foreground">
            {notice}
          </p>
        )}

        <div className="flex flex-col gap-2">
          {nativeReady ? (
            <>
              <Button type="button" disabled={busy !== null} onClick={() => void handlePurchase()}>
                {busy === "purchase" ? (
                  <>
                    <Loader2 className="size-4 animate-spin" aria-hidden />
                    {tr("paywall.processing")}
                  </>
                ) : (
                  tr("paywall.cta")
                )}
              </Button>
              <Button
                type="button"
                variant="ghost"
                disabled={busy !== null}
                onClick={() => void handleRestore()}
              >
                {busy === "restore" ? (
                  <>
                    <Loader2 className="size-4 animate-spin" aria-hidden />
                    {tr("paywall.restoring")}
                  </>
                ) : (
                  tr("paywall.restore")
                )}
              </Button>
            </>
          ) : (
            <Button type="button" variant="outline" onClick={onClose}>
              {tr("script.dialogClose")}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
