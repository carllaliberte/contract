import { metaEntitlements } from "../../../shared/meta-entitlements";
import {
  PLAN_LIMITS,
  limitForFormat,
  type PlanId,
  type ScriptFormat,
  type LongDuration,
  allowedLongDurations,
  defaultLongDuration,
} from "./plans";

export {
  PLAN_LIMITS,
  type PlanId,
  type PlanId as Plan,
  type ScriptFormat,
  type LongDuration,
  limitForFormat,
  allowedLongDurations,
  defaultLongDuration,
};

/** Flat short-script caps (legacy imports, META holder bonus base). */
export const LIMITS = {
  free: PLAN_LIMITS.free.short,
  pro: PLAN_LIMITS.pro.short,
} as const;

/** Bonus monthly short scripts when on-chain META holder tier is verified (future). */
export const META_HOLDER_BONUS_AI = metaEntitlements.creatorflow.holderBonusAiPerMonth;

export function limitForPlan(
  plan: PlanId,
  options?: { metaHolderBonus?: boolean; format?: ScriptFormat },
): number {
  const base = limitForFormat(plan, options?.format ?? "short");
  const bonus = options?.metaHolderBonus ? META_HOLDER_BONUS_AI : 0;
  return base + bonus;
}
