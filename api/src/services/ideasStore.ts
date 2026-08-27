import type { SupabaseClient } from "@supabase/supabase-js";
import { env } from "../env.js";
import { getSupabaseAdminClient } from "../middleware/auth.js";

export type IdeaRow = {
  id: string;
  user_id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  platform: string;
  script: string | null;
  thumbnail: string;
  video_url: string | null;
  scheduled_at: string | null;
  updated_at: string;
};

export type IdeasStore = {
  list(): Promise<IdeaRow[]>;
  replaceAll(rows: IdeaRow[]): Promise<IdeaRow[]>;
};

const memoryByUser = new Map<string, IdeaRow[]>();

export function clearMemoryIdeasStore(): void {
  memoryByUser.clear();
}

export function createMemoryIdeasStore(userId: string): IdeasStore {
  return {
    async list() {
      return structuredClone(memoryByUser.get(userId) ?? []);
    },
    async replaceAll(rows) {
      memoryByUser.set(userId, structuredClone(rows));
      return rows;
    },
  };
}

export function createSupabaseIdeasStore(
  supabase: SupabaseClient,
  userId: string,
): IdeasStore {
  return {
    async list() {
      const { data, error } = await supabase
        .from("ideas")
        .select("*")
        .eq("user_id", userId)
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as IdeaRow[];
    },
    async replaceAll(rows) {
      const { error: deleteError } = await supabase
        .from("ideas")
        .delete()
        .eq("user_id", userId);
      if (deleteError) throw deleteError;
      if (rows.length === 0) return [];
      const { data, error } = await supabase.from("ideas").insert(rows).select();
      if (error) throw error;
      return (data ?? []) as IdeaRow[];
    },
  };
}

export async function resolveIdeasStore(userId: string): Promise<IdeasStore> {
  if (userId.startsWith("demo:") || env.memoryStore) {
    return createMemoryIdeasStore(userId);
  }

  const admin = getSupabaseAdminClient();
  if (!admin) return createMemoryIdeasStore(userId);

  return createSupabaseIdeasStore(admin, userId);
}
