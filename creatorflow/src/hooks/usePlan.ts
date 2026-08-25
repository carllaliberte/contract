import { useEffect, useState } from "react";
import { getCurrentPlan, subscribePlan } from "../lib/aiUsage";
import type { PlanId } from "../lib/plans";

export function usePlan(): PlanId {
  const [plan, setPlan] = useState<PlanId>(() => getCurrentPlan());

  useEffect(() => {
    return subscribePlan(() => setPlan(getCurrentPlan()));
  }, []);

  return plan;
}
