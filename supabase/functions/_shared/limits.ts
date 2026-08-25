export type PlanId = "free" | "pro";
export type ScriptFormat = "short" | "long";

export const PLAN_LIMITS = {
  free: { short: 8, long: 2, maxLongMinutes: 12 },
  pro: { short: 100, long: 50, maxLongMinutes: 30 },
} as const;

export const LIMITS = {
  free: PLAN_LIMITS.free.short,
  pro: PLAN_LIMITS.pro.short,
} as const;

export type Plan = PlanId;

export function limitForFormat(plan: string, format: ScriptFormat): number {
  const key = plan === "pro" ? "pro" : "free";
  return PLAN_LIMITS[key][format];
}

export function limitForPlan(plan: string): number {
  return limitForFormat(plan, "short");
}

export function isScriptFormat(value: string): value is ScriptFormat {
  return value === "short" || value === "long";
}

export function isLongDuration(value: number): value is 8 | 12 | 20 | 30 {
  return value === 8 || value === 12 || value === 20 || value === 30;
}

export function maxLongMinutesForPlan(plan: string): number {
  return plan === "pro" ? PLAN_LIMITS.pro.maxLongMinutes : PLAN_LIMITS.free.maxLongMinutes;
}
