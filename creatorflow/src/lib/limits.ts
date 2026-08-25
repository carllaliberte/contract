import { metaEntitlements } from "../../../shared/meta-entitlements";

export const LIMITS = { free: 8, pro: 200 } as const;

/** Bonus monthly AI generations when on-chain META holder tier is verified (future). */
export const META_HOLDER_BONUS_AI = metaEntitlements.creatorflow.holderBonusAiPerMonth;

export type PlanId = keyof typeof LIMITS;

export function limitForPlan(plan: PlanId, options?: { metaHolderBonus?: boolean }): number {
  const base = LIMITS[plan];
  const bonus = options?.metaHolderBonus ? META_HOLDER_BONUS_AI : 0;
  return base + bonus;
}
