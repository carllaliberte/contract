export type PlanId = "free" | "pro";
export type ScriptFormat = "short" | "long";
export type LongDuration = 8 | 12 | 20 | 30;

export const PLAN_LIMITS = {
  free: { short: 8, long: 2, maxLongMinutes: 12 },
  pro: { short: 100, long: 50, maxLongMinutes: 30 },
} as const;

export const LONG_DURATIONS: readonly LongDuration[] = [8, 12, 20, 30];

export const IAP_PRODUCT_IDS = {
  monthly: "cf_pro_monthly",
  yearly: "cf_pro_yearly",
} as const;

export type IapProductId =
  (typeof IAP_PRODUCT_IDS)[keyof typeof IAP_PRODUCT_IDS];

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

export function limitForFormat(plan: PlanId, format: ScriptFormat): number {
  return PLAN_LIMITS[plan][format];
}

export function allowedLongDurations(plan: PlanId): LongDuration[] {
  const max = PLAN_LIMITS[plan].maxLongMinutes;
  return LONG_DURATIONS.filter((d) => d <= max);
}

export function defaultLongDuration(plan: PlanId): LongDuration {
  const allowed = allowedLongDurations(plan);
  return allowed[allowed.length - 1] ?? 8;
}
