/**
 * Single source of truth for CreatorFlow plan quotas and IAP product IDs.
 * Keep api/src/limits.ts and supabase/functions/_shared/limits.ts in sync via re-exports.
 */

export type PlanId = "free" | "pro";
export type ScriptFormat = "short" | "long";
export type LongDuration = 8 | 12 | 20 | 30;

export const PLAN_LIMITS = {
  free: { short: 8, long: 2, maxLongMinutes: 12 },
  pro: { short: 100, long: 50, maxLongMinutes: 30 },
} as const;

export const LONG_DURATIONS: readonly LongDuration[] = [8, 12, 20, 30];

/** App Store Connect product identifiers — see creatorflow/docs/IAP_CATALOG.md */
export const IAP_PRODUCT_IDS = {
  monthly: "cf_pro_monthly",
  yearly: "cf_pro_yearly",
} as const;

export type IapProductId = (typeof IAP_PRODUCT_IDS)[keyof typeof IAP_PRODUCT_IDS];

export const IAP_CATALOG = {
  [IAP_PRODUCT_IDS.monthly]: {
    plan: "pro" as const,
    interval: "monthly" as const,
    priceCad: 6.99,
    displayPrice: "6,99 $",
  },
  [IAP_PRODUCT_IDS.yearly]: {
    plan: "pro" as const,
    interval: "yearly" as const,
    priceCad: 59.99,
    displayPrice: "59,99 $",
  },
} as const;

/** @deprecated Use PLAN_LIMITS — kept for legacy imports */
export const LIMITS = {
  free: PLAN_LIMITS.free.short,
  pro: PLAN_LIMITS.pro.short,
} as const;

export type Plan = PlanId;

export function limitForFormat(plan: PlanId | string, format: ScriptFormat): number {
  const key = plan === "pro" ? "pro" : "free";
  return PLAN_LIMITS[key][format];
}

export function limitForPlan(plan: PlanId | string): number {
  return limitForFormat(plan, "short");
}

export function allowedLongDurations(plan: PlanId): LongDuration[] {
  const max = PLAN_LIMITS[plan].maxLongMinutes;
  return LONG_DURATIONS.filter((duration) => duration <= max);
}

export function defaultLongDuration(plan: PlanId): LongDuration {
  const allowed = allowedLongDurations(plan);
  return allowed[allowed.length - 1] ?? 8;
}

export function isScriptFormat(value: string): value is ScriptFormat {
  return value === "short" || value === "long";
}

export function isLongDuration(value: number): value is LongDuration {
  return value === 8 || value === 12 || value === 20 || value === 30;
}

export function maxLongMinutesForPlan(plan: PlanId | string): number {
  return plan === "pro" ? PLAN_LIMITS.pro.maxLongMinutes : PLAN_LIMITS.free.maxLongMinutes;
}
