import type { SupabaseClient } from "@supabase/supabase-js";
import type { Platform } from "../types.js";

export function isDemoUserId(userId: string): boolean {
  return userId.startsWith("demo:");
}

export async function logAiGeneration(
  supabase: SupabaseClient,
  payload: {
    userId: string;
    ideaId: string;
    platform: Platform;
  },
): Promise<void> {
  if (isDemoUserId(payload.userId)) return;

  const { error } = await supabase.from("ai_generations").insert({
    user_id: payload.userId,
    idea_id: payload.ideaId,
    platform: payload.platform,
  });

  if (error) {
    console.warn("ai_generations insert failed:", error.message);
  }
}
