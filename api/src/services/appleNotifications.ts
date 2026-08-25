import type { SupabaseClient } from "@supabase/supabase-js";
import { verifySignedTransaction, type VerifiedTransaction } from "./appleIap.js";
import { setUserPlan } from "./profilePlan.js";

type NotificationPayload = {
  notificationType?: string;
  subtype?: string;
  data?: {
    signedTransactionInfo?: string;
    signedRenewalInfo?: string;
  };
};

function decodeNotificationPayload(signedPayload: string): NotificationPayload {
  const parts = signedPayload.split(".");
  if (parts.length < 2) throw new Error("Invalid notification payload");
  return JSON.parse(
    Buffer.from(parts[1], "base64url").toString("utf8"),
  ) as NotificationPayload;
}

async function findUserIdByTransaction(
  supabase: SupabaseClient,
  originalTransactionId: string,
): Promise<string | null> {
  const { data } = await supabase
    .from("iap_subscriptions")
    .select("user_id")
    .eq("original_transaction_id", originalTransactionId)
    .maybeSingle();
  return data?.user_id ?? null;
}

export async function handleAppleServerNotification(
  supabase: SupabaseClient,
  signedPayload: string,
): Promise<void> {
  const notification = decodeNotificationPayload(signedPayload);
  const signedTransaction = notification.data?.signedTransactionInfo;
  if (!signedTransaction) return;

  let transaction: VerifiedTransaction;
  try {
    const parts = signedTransaction.split(".");
    const payload = JSON.parse(
      Buffer.from(parts[1], "base64url").toString("utf8"),
    ) as { productId?: string };
    const productId = payload.productId ?? "cf_pro_monthly";
    transaction = verifySignedTransaction(signedTransaction, productId);
  } catch {
    return;
  }

  const userId = await findUserIdByTransaction(
    supabase,
    transaction.originalTransactionId,
  );
  if (!userId) return;

  const type = notification.notificationType ?? "";
  const downgradeTypes = new Set([
    "EXPIRED",
    "REFUND",
    "REVOKE",
    "GRACE_PERIOD_EXPIRED",
  ]);

  if (downgradeTypes.has(type)) {
    await setUserPlan(supabase, userId, "free");
    return;
  }

  if (
    type === "DID_RENEW" ||
    type === "SUBSCRIBED" ||
    type === "DID_CHANGE_RENEWAL_STATUS"
  ) {
    await setUserPlan(supabase, userId, "pro");
  }
}
