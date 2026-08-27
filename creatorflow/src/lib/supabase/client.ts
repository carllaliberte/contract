import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getAuthToken } from "../auth/session";

let cachedClient: SupabaseClient | null = null;

export function isSupabaseConfigured(): boolean {
  const url = import.meta.env.VITE_SUPABASE_URL?.trim();
  const anon = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();
  return Boolean(url && anon);
}

export function getSupabaseClient(): SupabaseClient | null {
  if (!isSupabaseConfigured()) return null;
  if (cachedClient) return cachedClient;

  const url = import.meta.env.VITE_SUPABASE_URL!.trim();
  const anon = import.meta.env.VITE_SUPABASE_ANON_KEY!.trim();

  cachedClient = createClient(url, anon, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: async (input, init) => {
        const token = await getAuthToken();
        const headers = new Headers(init?.headers);
        if (token) headers.set("Authorization", `Bearer ${token}`);
        return fetch(input, { ...init, headers });
      },
    },
  });

  return cachedClient;
}
