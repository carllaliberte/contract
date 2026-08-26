/**
 * StoreKit / IAP bridge with server-side receipt validation.
 * Production billing requires native Capacitor plugin + POST /iap/apple/validate.
 */
import { Capacitor } from "@capacitor/core";
import {
  IAP_CATALOG,
  IAP_PRODUCT_IDS,
  type IapProductId,
} from "./plans";
import { setCurrentPlan } from "./aiUsage";
import { getAuthToken } from "./auth/session";

export type PurchaseResult =
  | { ok: true; productId: IapProductId }
  | { ok: false; reason: "unavailable" | "cancelled" | "error"; message?: string };

export type RestoreResult =
  | { ok: true; activeProductId: IapProductId | null }
  | { ok: false; reason: "unavailable" | "error"; message?: string };

function resolveIapValidateUrl(): string {
  const dedicated = import.meta.env.VITE_IAP_VALIDATE_URL?.trim();
  if (dedicated) return dedicated;

  const apiBase = import.meta.env.VITE_API_URL?.trim();
  if (apiBase) {
    return `${apiBase.replace(/\/$/, "")}/iap/apple/validate`;
  }

  return "/iap/apple/validate";
}

export function isIapNativeBridgeAvailable(): boolean {
  if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== "ios") {
    return false;
  }
  return Boolean(
    (window as Window & { CreatorFlowStoreKit?: unknown }).CreatorFlowStoreKit,
  );
}

async function syncPlanWithServer(
  productId: IapProductId,
  signedTransaction?: string,
): Promise<boolean> {
  const token = await getAuthToken();
  if (!token || token.startsWith("stub.")) {
    return false;
  }

  try {
    const response = await fetch(resolveIapValidateUrl(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ productId, signedTransaction }),
    });

    if (!response.ok) return false;
    const data = (await response.json()) as { plan?: string; ok?: boolean };
    return data.ok === true && data.plan === "pro";
  } catch {
    return false;
  }
}

/**
 * Purchase flow — calls native bridge when available, then validates server-side.
 */
export async function purchaseProduct(productId: IapProductId): Promise<PurchaseResult> {
  const bridge = (
    window as Window & {
      CreatorFlowStoreKit?: {
        purchase?: (id: string) => Promise<{ productId: string; signedTransaction?: string }>;
      };
    }
  ).CreatorFlowStoreKit;

  if (!isIapNativeBridgeAvailable() || !bridge?.purchase) {
    return {
      ok: false,
      reason: "unavailable",
    };
  }

  try {
    const result = await bridge.purchase(productId);
    const catalog = IAP_CATALOG[productId];
    if (catalog?.plan === "pro") {
      const synced = await syncPlanWithServer(
        productId,
        result.signedTransaction,
      );
      if (synced) {
        setCurrentPlan("pro");
      }
    }
    return { ok: true, productId: result.productId as IapProductId };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Purchase failed";
    if (/cancel/i.test(message)) {
      return { ok: false, reason: "cancelled", message };
    }
    return { ok: false, reason: "error", message };
  }
}

/**
 * Restore purchases — native bridge hook for App Store restore.
 */
export async function restorePurchases(): Promise<RestoreResult> {
  const bridge = (
    window as Window & {
      CreatorFlowStoreKit?: {
        restore?: () => Promise<{
          activeProductId: string | null;
          signedTransaction?: string | null;
        }>;
      };
    }
  ).CreatorFlowStoreKit;

  if (!isIapNativeBridgeAvailable() || !bridge?.restore) {
    return {
      ok: false,
      reason: "unavailable",
    };
  }

  try {
    const result = await bridge.restore();
    const activeId = result.activeProductId as IapProductId | null;
    if (activeId && IAP_CATALOG[activeId]?.plan === "pro") {
      const synced = await syncPlanWithServer(
        activeId,
        result.signedTransaction ?? undefined,
      );
      if (synced) {
        setCurrentPlan("pro");
      }
    }
    return { ok: true, activeProductId: activeId };
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
