import type { AiUsageSnapshot } from "../types.js";
import { currentMonth, env } from "../env.js";

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
    if (!row) return snapshot(0, env.monthlyAiLimit);
    return snapshot(row.count, row.limit);
  },

  async incrementUsage(userId: string): Promise<AiUsageSnapshot> {
    const key = memoryKey(userId);
    const row = memory.get(key) ?? { count: 0, limit: env.monthlyAiLimit };
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
  supabase: {
    from: (table: string) => {
      select: (columns: string) => {
        eq: (col: string, val: string) => {
          eq: (col2: string, val2: string) => {
            maybeSingle: () => Promise<{
              data: { count: number; limit: number } | null;
              error: { message: string } | null;
            }>;
          };
        };
      };
      upsert: (
        row: Record<string, unknown>,
        opts: { onConflict: string },
      ) => Promise<{ error: { message: string } | null }>;
      update: (patch: Record<string, unknown>) => {
        eq: (col: string, val: string) => {
          eq: (col2: string, val2: string) => {
            select: (columns: string) => {
              single: () => Promise<{
                data: { count: number; limit: number } | null;
                error: { message: string } | null;
              }>;
            };
          };
        };
      };
    };
    rpc: (
      fn: string,
      args: Record<string, unknown>,
    ) => Promise<{
      data: { count: number; limit: number; remaining: number }[] | null;
      error: { message: string; code?: string } | null;
    }>;
  },
): UsageStore {
  return {
    async getUsage(userId: string): Promise<AiUsageSnapshot> {
      const month = currentMonth();
      const { data, error } = await supabase
        .from("ai_usage")
        .select("count, limit")
        .eq("user_id", userId)
        .eq("month", month)
        .maybeSingle();

      if (error) throw new Error(error.message);

      if (!data) return snapshot(0, env.monthlyAiLimit);
      return snapshot(data.count, data.limit);
    },

    async incrementUsage(userId: string): Promise<AiUsageSnapshot> {
      const month = currentMonth();
      const { data, error } = await supabase.rpc("increment_ai_usage", {
        p_user_id: userId,
        p_month: month,
        p_limit: env.monthlyAiLimit,
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
