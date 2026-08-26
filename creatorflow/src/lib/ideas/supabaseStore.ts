import type { Idea } from "../../data/demo";
import { getSupabaseClient } from "../supabase/client";

export type IdeaRow = {
  id: string;
  user_id: string;
  title: string;
  description: string;
  status: Idea["status"];
  priority: Idea["priority"];
  platform: Idea["platform"];
  updated_at: string;
  scheduled_at: string | null;
  script: string | null;
  thumbnail: string;
  video_url: string | null;
};

export function ideaFromRow(row: IdeaRow): Idea {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    status: row.status,
    priority: row.priority,
    platform: row.platform,
    updatedAt: row.updated_at,
    scheduledAt: row.scheduled_at ?? undefined,
    script: row.script ?? undefined,
    thumbnail: row.thumbnail,
    videoUrl: row.video_url ?? undefined,
  };
}

export function ideaToRow(idea: Idea, userId: string): IdeaRow {
  return {
    id: idea.id,
    user_id: userId,
    title: idea.title,
    description: idea.description,
    status: idea.status,
    priority: idea.priority,
    platform: idea.platform,
    updated_at: idea.updatedAt,
    scheduled_at: idea.scheduledAt ?? null,
    script: idea.script ?? null,
    thumbnail: idea.thumbnail,
    video_url: idea.videoUrl ?? null,
  };
}

export async function fetchIdeasFromSupabase(): Promise<Idea[] | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  const { data, error } = await client
    .from("ideas")
    .select("*")
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("Failed to load ideas from Supabase:", error.message);
    return null;
  }

  return (data as IdeaRow[]).map(ideaFromRow);
}

export async function upsertIdeaInSupabase(
  idea: Idea,
  userId: string,
): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;

  const { error } = await client.from("ideas").upsert(ideaToRow(idea, userId));
  if (error) {
    console.error("Failed to upsert idea in Supabase:", error.message);
    return false;
  }
  return true;
}

export async function deleteIdeaInSupabase(id: string): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;

  const { error } = await client.from("ideas").delete().eq("id", id);
  if (error) {
    console.error("Failed to delete idea in Supabase:", error.message);
    return false;
  }
  return true;
}

export async function upsertIdeasInSupabase(
  ideas: Idea[],
  userId: string,
): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client || ideas.length === 0) return false;

  const { error } = await client
    .from("ideas")
    .upsert(ideas.map((idea) => ideaToRow(idea, userId)));

  if (error) {
    console.error("Failed to bulk upsert ideas in Supabase:", error.message);
    return false;
  }
  return true;
}
