export const LIMITS = { free: 8, pro: 200 } as const;

export type Plan = keyof typeof LIMITS;

export function limitForPlan(plan: string): number {
  return plan === "pro" ? LIMITS.pro : LIMITS.free;
}
