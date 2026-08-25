/**
 * StoreKit / IAP bridge for CreatorFlow Pro subscriptions.
 */
import { Capacitor } from "@capacitor/core";
import { CreatorFlowStoreKit } from "creatorflow-storekit";
import {
  IAP_CATALOG,
  IAP_PRODUCT_IDS,
  type IapProductId,
} from "./plans";
import { syncAiUsage } from "./aiUsage";
import { restoreApplePurchases, validateApplePurchase } from "./api/iap";

export type PurchaseResult =
  | { ok: true; productId: IapProductId }
  | { ok: false; reason: "unavailable" | "cancelled" | "error"; message?: string };

export type RestoreResult =
  | { ok: true; activeProductId: IapProductId | null }
  | { ok: false; reason: "unavailable" | "error"; message?: string };

export function isIapNativeBridgeAvailable(): boolean {
  return Capacitor.isNativePlatform() && Capacitor.getPlatform() === "ios";
}

async function syncServerUsage(productId: string, signedTransaction: string) {
  const result = await validateApplePurchase({ productId, signedTransaction });
  syncAiUsage(result.usage);
  return result;
}

/**
 * Purchase flow — StoreKit 2 on iOS, then server-side receipt validation.
 */
export async function purchaseProduct(productId: IapProductId): Promise<PurchaseResult> {
  if (!isIapNativeBridgeAvailable()) {
    return { ok: false, reason: "unavailable" };
  }

  try {
    const native = await CreatorFlowStoreKit.purchase({ productId });
    await syncServerUsage(native.productId, native.signedTransaction);
    return { ok: true, productId: native.productId as IapProductId };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Purchase failed";
    if (/cancel/i.test(message)) {
      return { ok: false, reason: "cancelled", message };
    }
    return { ok: false, reason: "error", message };
  }
}

/**
 * Restore purchases — StoreKit entitlements + server sync.
 */
export async function restorePurchases(): Promise<RestoreResult> {
  if (!isIapNativeBridgeAvailable()) {
    return { ok: false, reason: "unavailable" };
  }

  try {
    const native = await CreatorFlowStoreKit.restore();
    const result = await restoreApplePurchases({
      productId: native.activeProductId ?? undefined,
      signedTransaction: native.signedTransaction,
    });
    syncAiUsage(result.usage);

    return {
      ok: true,
      activeProductId: result.activeProductId as IapProductId | null,
    };
  } catch (error) {
    return {
      ok: false,
      reason: "error",
      message: error instanceof Error ? error.message : "Restore failed",
    };
  }
}

export { IAP_PRODUCT_IDS, IAP_CATALOG };
export type { IapProductId } from "./plans";
