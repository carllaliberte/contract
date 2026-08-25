import type { SupabaseClient } from "@supabase/supabase-js";
import type { PlanId } from "../limits.js";
import { isActiveSubscription } from "./appleIap.js";
import type { VerifiedTransaction } from "./appleIap.js";

export async function upsertIapSubscription(
  supabase: SupabaseClient,
  userId: string,
  transaction: VerifiedTransaction,
): Promise<void> {
  const { error } = await supabase.from("iap_subscriptions").upsert(
    {
      user_id: userId,
      product_id: transaction.productId,
      original_transaction_id: transaction.originalTransactionId,
      expires_at: transaction.expiresAt?.toISOString() ?? null,
      environment: transaction.environment,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "original_transaction_id" },
  );

  if (error) {
    throw new Error(error.message);
  }
}

export async function setUserPlan(
  supabase: SupabaseClient,
  userId: string,
  plan: PlanId,
): Promise<void> {
  const { error } = await supabase.rpc("set_profile_plan", {
    p_user_id: userId,
    p_plan: plan,
  });

  if (error) {
    throw new Error(error.message);
  }
}

export async function applyVerifiedTransaction(
  supabase: SupabaseClient,
  userId: string,
  transaction: VerifiedTransaction,
): Promise<PlanId> {
  await upsertIapSubscription(supabase, userId, transaction);
  const plan: PlanId = isActiveSubscription(transaction.expiresAt)
    ? "pro"
    : "free";
  await setUserPlan(supabase, userId, plan);
  return plan;
}

export async function downgradeExpiredSubscriptions(
  supabase: SupabaseClient,
  userId: string,
): Promise<PlanId> {
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("iap_subscriptions")
    .select("expires_at")
    .eq("user_id", userId)
    .order("expires_at", { ascending: false, nullsFirst: false });

  if (error) {
    throw new Error(error.message);
  }

  const active = (data ?? []).some((row) => {
    if (!row.expires_at) return true;
    return new Date(row.expires_at).getTime() > Date.now();
  });

  const plan: PlanId = active ? "pro" : "free";
  await setUserPlan(supabase, userId, plan);
  return plan;
}
