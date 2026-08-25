import { useEffect, useState } from "react";
import { getCurrentPlan, subscribePlan } from "../lib/aiUsage";
import { fetchProfile } from "../lib/api/profile";
import { resolveSessionKind } from "../lib/auth/session";
import type { PlanId } from "../lib/plans";

export function usePlan(): PlanId {
  const [plan, setPlan] = useState<PlanId>(() => getCurrentPlan());

  useEffect(() => {
    return subscribePlan(() => setPlan(getCurrentPlan()));
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function syncFromServer() {
      const sessionKind = await resolveSessionKind();
      if (sessionKind !== "apple") return;

      const profile = await fetchProfile();
      if (!profile || cancelled) return;
      if (profile.usage.plan !== getCurrentPlan()) {
        const { syncAiUsage } = await import("../lib/aiUsage");
        syncAiUsage(profile.usage);
      }
    }

    void syncFromServer();
    return () => {
      cancelled = true;
    };
  }, []);

  return plan;
}
