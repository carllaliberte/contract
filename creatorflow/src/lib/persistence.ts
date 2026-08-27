import type { SessionKind } from "./auth/session";

export type PersistenceMode = "local" | "supabase" | "api";

/**
 * Cloud path for signed-in users:
 * 1. Direct Supabase when the client is configured (granular upserts).
 * 2. CreatorFlow API `/ideas` when only `VITE_API_URL` is set (typical Pages go-live).
 * Demo / unsigned sessions stay on localStorage.
 */
export function resolvePersistenceMode(input: {
  session: SessionKind;
  supabaseConfigured: boolean;
  apiConfigured: boolean;
}): PersistenceMode {
  if (input.session !== "apple") return "local";
  if (input.supabaseConfigured) return "supabase";
  if (input.apiConfigured) return "api";
  return "local";
}
