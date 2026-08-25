import {
  limitForFormat,
  maxLongMinutesForPlan,
  type PlanId,
  type ScriptFormat,
} from "../limits.js";
import type { AiUsageSnapshot, FormatQuota } from "../types.js";
import type { SupabaseClient } from "@supabase/supabase-js";
import { currentMonth } from "../env.js";

export type UsageStore = {
  getUsage(userId: string): Promise<AiUsageSnapshot>;
  incrementUsage(userId: string, format: ScriptFormat): Promise<AiUsageSnapshot>;
};

type MemoryRow = {
  shortCount: number;
  longCount: number;
  plan: PlanId;
};

const memory = new Map<string, MemoryRow>();

function memoryKey(userId: string): string {
  return `${userId}:${currentMonth()}`;
}

function formatQuota(count: number, plan: PlanId, format: ScriptFormat): FormatQuota {
  const limit = limitForFormat(plan, format);
  return { count, limit, remaining: Math.max(0, limit - count) };
}

function snapshot(row: MemoryRow): AiUsageSnapshot {
  return {
    plan: row.plan,
    short: formatQuota(row.shortCount, row.plan, "short"),
    long: formatQuota(row.longCount, row.plan, "long"),
  };
}

function emptyRow(plan: PlanId = "free"): MemoryRow {
  return { shortCount: 0, longCount: 0, plan };
}

function parseUsageRow(row: {
  short_count?: number;
  long_count?: number;
  short_limit?: number;
  long_limit?: number;
  short_remaining?: number;
  long_remaining?: number;
  plan?: string;
}): AiUsageSnapshot {
  const plan: PlanId = row.plan === "pro" ? "pro" : "free";
  return {
    plan,
    short: {
      count: row.short_count ?? 0,
      limit: row.short_limit ?? limitForFormat(plan, "short"),
      remaining: row.short_remaining ?? 0,
    },
    long: {
      count: row.long_count ?? 0,
      limit: row.long_limit ?? limitForFormat(plan, "long"),
      remaining: row.long_remaining ?? 0,
    },
  };
}

export function setMemoryUserPlan(userId: string, plan: PlanId): void {
  const key = memoryKey(userId);
  const row = memory.get(key) ?? emptyRow(plan);
  row.plan = plan;
  memory.set(key, row);
}

export const memoryUsageStore: UsageStore = {
  async getUsage(userId: string): Promise<AiUsageSnapshot> {
    const row = memory.get(memoryKey(userId)) ?? emptyRow();
    return snapshot(row);
  },

  async incrementUsage(userId: string, format: ScriptFormat): Promise<AiUsageSnapshot> {
    const key = memoryKey(userId);
    const row = memory.get(key) ?? emptyRow();
    const limit = limitForFormat(row.plan, format);
    const count = format === "long" ? row.longCount : row.shortCount;
    if (count >= limit) {
      const err = new Error("LIMIT_REACHED");
      (err as Error & { usage?: AiUsageSnapshot }).usage = snapshot(row);
      throw err;
    }
    if (format === "long") row.longCount += 1;
    else row.shortCount += 1;
    memory.set(key, row);
    return snapshot(row);
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

      const plan: PlanId = profile?.plan === "pro" ? "pro" : "free";

      const { data, error } = await supabase
        .from("ai_usage")
        .select("short_count, long_count")
        .eq("user_id", userId)
        .eq("month", month)
        .maybeSingle();

      if (error) throw new Error(error.message);

      return {
        plan,
        short: formatQuota(data?.short_count ?? 0, plan, "short"),
        long: formatQuota(data?.long_count ?? 0, plan, "long"),
      };
    },

    async incrementUsage(userId: string, format: ScriptFormat): Promise<AiUsageSnapshot> {
      const month = currentMonth();
      const { data, error } = await supabase.rpc("increment_ai_usage", {
        p_user_id: userId,
        p_month: month,
        p_format: format,
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

      const row = data?.[0];
      if (!row) throw new Error("increment_ai_usage returned no row");
      return parseUsageRow(row);
    },
  };
}

export async function assertCanGenerate(
  store: UsageStore,
  userId: string,
  format: ScriptFormat,
): Promise<AiUsageSnapshot> {
  const usage = await store.getUsage(userId);
  const quota = format === "long" ? usage.long : usage.short;
  if (quota.count >= quota.limit) {
    const err = new Error("LIMIT_REACHED");
    (err as Error & { usage?: AiUsageSnapshot }).usage = usage;
    throw err;
  }
  return usage;
}

export function validateDurationForPlan(
  plan: PlanId,
  format: ScriptFormat,
  durationMinutes?: number,
): string | null {
  if (format !== "long") return null;
  if (!durationMinutes) return "durationMinutes is required for long format";
  const max = maxLongMinutesForPlan(plan);
  if (durationMinutes > max) {
    return `Long scripts are limited to ${max} minutes on the ${plan} plan`;
  }
  return null;
}

export function clearMemoryUsageStore(): void {
  memory.clear();
}
