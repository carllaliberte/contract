import { createHash } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  GenerateMode,
  Language,
  Platform,
  PlanId,
  ScriptFormat,
} from "../types.js";
import { isDemoUserId } from "./aiGenerations.js";

export type ProvenanceRecord = {
  userId: string;
  ideaId: string;
  platform: Platform;
  format: ScriptFormat;
  mode: GenerateMode;
  language: Language;
  plan: PlanId;
  model: string;
  titleHash: string;
};

export function hashPromptTitle(title: string): string {
  return createHash("sha256").update(title.trim()).digest("hex").slice(0, 16);
}

/**
 * Persist generation provenance for audit trails and support.
 * Demo users are skipped; failures are logged but non-blocking.
 */
export async function recordGenerationProvenance(
  supabase: SupabaseClient | null,
  record: ProvenanceRecord,
): Promise<void> {
  if (!supabase || isDemoUserId(record.userId)) return;

  const payload = {
    user_id: record.userId,
    idea_id: record.ideaId,
    platform: record.platform,
    format: record.format,
    mode: record.mode,
    language: record.language,
    plan: record.plan,
    model: record.model,
    title_hash: record.titleHash,
  };

  const { error } = await supabase.from("ai_generations").insert(payload);
  if (error) {
    console.warn("provenance insert failed:", error.message);
  }
}
