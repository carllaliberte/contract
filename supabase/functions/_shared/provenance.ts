import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.49.8";
import type {
  GenerateMode,
  Language,
  Platform,
  PlanId,
  ScriptFormat,
} from "./types.ts";

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

export async function hashPromptTitle(title: string): Promise<string> {
  const data = new TextEncoder().encode(title.trim());
  const digest = await crypto.subtle.digest("SHA-256", data);
  const hex = Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return hex.slice(0, 16);
}

export async function recordGenerationProvenance(
  admin: SupabaseClient,
  record: ProvenanceRecord,
  isDemo: boolean,
): Promise<void> {
  if (isDemo) return;

  const { error } = await admin.from("ai_generations").insert({
    user_id: record.userId,
    idea_id: record.ideaId,
    platform: record.platform,
    format: record.format,
    mode: record.mode,
    language: record.language,
    plan: record.plan,
    model: record.model,
    title_hash: record.titleHash,
  });

  if (error) console.warn("provenance insert failed:", error.message);
}
