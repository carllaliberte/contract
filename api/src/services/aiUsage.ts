import { LIMITS, limitForPlan } from "../limits.js";
import type { AiUsageSnapshot } from "../types.js";
import type { SupabaseClient } from "@supabase/supabase-js";
import { currentMonth } from "../env.js";

export type UsageStore = {
  getUsage(userId: string): Promise<AiUsageSnapshot>;
  incrementUsage(userId: string): Promise<AiUsageSnapshot>;
};

type MemoryRow = { count: number; limit: number };

const memory = new Map<string, MemoryRow>();

function memoryKey(userId: string): string {
  return `${userId}:${currentMonth()}`;
}

function snapshot(count: number, limit: number): AiUsageSnapshot {
  return {
    count,
    limit,
    remaining: Math.max(0, limit - count),
  };
}

export const memoryUsageStore: UsageStore = {
  async getUsage(userId: string): Promise<AiUsageSnapshot> {
    const row = memory.get(memoryKey(userId));
    if (!row) return snapshot(0, LIMITS.free);
    return snapshot(row.count, row.limit);
  },

  async incrementUsage(userId: string): Promise<AiUsageSnapshot> {
    const key = memoryKey(userId);
    const row = memory.get(key) ?? { count: 0, limit: LIMITS.free };
    if (row.count >= row.limit) {
      const err = new Error("LIMIT_REACHED");
      (err as Error & { usage?: AiUsageSnapshot }).usage = snapshot(
        row.count,
        row.limit,
      );
      throw err;
    }
    row.count += 1;
    memory.set(key, row);
    return snapshot(row.count, row.limit);
  },
};

export function createSupabaseUsageStore(
  supabase: SupabaseClient,
): UsageStore {
  return {
    async getUsage(userId: string): Promise<AiUsageSnapshot> {
      const month = currentMonth();

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("plan")
        .eq("id", userId)
        .maybeSingle();

      if (profileError) throw new Error(profileError.message);

      const limit = limitForPlan(profile?.plan ?? "free");

      const { data, error } = await supabase
        .from("ai_usage")
        .select("count")
        .eq("user_id", userId)
        .eq("month", month)
        .maybeSingle();

      if (error) throw new Error(error.message);

      const count = data?.count ?? 0;
      return snapshot(count, limit);
    },

    async incrementUsage(userId: string): Promise<AiUsageSnapshot> {
      const month = currentMonth();
      const { data, error } = await supabase.rpc("increment_ai_usage", {
        p_user_id: userId,
        p_month: month,
      });

      if (error) {
        if (error.message.includes("LIMIT_REACHED") || error.code === "P0001") {
          const usage = await this.getUsage(userId);
          const err = new Error("LIMIT_REACHED");
          (err as Error & { usage?: AiUsageSnapshot }).usage = usage;
          throw err;
        }
        throw new Error(error.message);
      }

      const row = data?.[0] as
        | { count: number; limit: number; remaining: number }
        | undefined;
      if (!row) throw new Error("increment_ai_usage returned no row");
      return snapshot(row.count, row.limit);
    },
  };
}

export async function assertCanGenerate(
  store: UsageStore,
  userId: string,
): Promise<AiUsageSnapshot> {
  const usage = await store.getUsage(userId);
  if (usage.count >= usage.limit) {
    const err = new Error("LIMIT_REACHED");
    (err as Error & { usage?: AiUsageSnapshot }).usage = usage;
    throw err;
  }
  return usage;
}

export function clearMemoryUsageStore(): void {
  memory.clear();
}
