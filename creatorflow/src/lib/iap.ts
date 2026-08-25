/**
 * StoreKit / IAP bridge stub.
 * Production billing is intentionally NOT wired until the native Capacitor plugin is connected.
 */
import { Capacitor } from "@capacitor/core";
import {
  IAP_CATALOG,
  IAP_PRODUCT_IDS,
  type IapProductId,
} from "./plans";
import { setCurrentPlan } from "./aiUsage";

export type PurchaseResult =
  | { ok: true; productId: IapProductId }
  | { ok: false; reason: "unavailable" | "cancelled" | "error"; message?: string };

export type RestoreResult =
  | { ok: true; activeProductId: IapProductId | null }
  | { ok: false; reason: "unavailable" | "error"; message?: string };

export function isIapNativeBridgeAvailable(): boolean {
  if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== "ios") {
    return false;
  }
  return Boolean(
    (window as Window & { CreatorFlowStoreKit?: unknown }).CreatorFlowStoreKit,
  );
}

/**
 * Purchase flow — calls native bridge when available, otherwise returns unavailable.
 * Does NOT simulate purchases in demo/web (per requirement: no production billing without StoreKit).
 */
export async function purchaseProduct(productId: IapProductId): Promise<PurchaseResult> {
  const bridge = (
    window as Window & {
      CreatorFlowStoreKit?: {
        purchase?: (id: string) => Promise<{ productId: string }>;
      };
    }
  ).CreatorFlowStoreKit;

  if (!isIapNativeBridgeAvailable() || !bridge?.purchase) {
    return {
      ok: false,
      reason: "unavailable",
      message: "StoreKit bridge not connected",
    };
  }

  try {
    const result = await bridge.purchase(productId);
    const catalog = IAP_CATALOG[productId];
    if (catalog?.plan === "pro") {
      setCurrentPlan("pro");
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
        restore?: () => Promise<{ activeProductId: string | null }>;
      };
    }
  ).CreatorFlowStoreKit;

  if (!isIapNativeBridgeAvailable() || !bridge?.restore) {
    return {
      ok: false,
      reason: "unavailable",
      message: "StoreKit bridge not connected",
    };
  }

  try {
    const result = await bridge.restore();
    const activeId = result.activeProductId as IapProductId | null;
    if (activeId && IAP_CATALOG[activeId]?.plan === "pro") {
      setCurrentPlan("pro");
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
