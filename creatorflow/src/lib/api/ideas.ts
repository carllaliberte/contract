import type { Idea, IdeaStatus, Priority } from "../../data/demo";
import { peekAuthToken, getAuthToken } from "../auth/session";
import { isPlatform } from "./types";

const DEMO_ID_KEY = "cf-demo-id";

const STATUSES: IdeaStatus[] = [
  "idea",
  "script",
  "production",
  "ready",
  "published",
];
const PRIORITIES: Priority[] = ["high", "medium", "low"];

export function resolveApiBase(): string {
  const configured = import.meta.env.VITE_API_URL?.trim() ?? "";
  if (!configured) return "";
  return configured.replace(/\/$/, "");
}

export function isApiConfigured(): boolean {
  return Boolean(resolveApiBase());
}

function resolveIdeasUrl(): string {
  const base = resolveApiBase();
  if (!base) return "/ideas";
  if (base.endsWith("/ideas")) return base;
  return `${base}/ideas`;
}

function getDemoId(): string {
  let id = localStorage.getItem(DEMO_ID_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(DEMO_ID_KEY, id);
  }
  return id;
}

async function requestHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  const token = peekAuthToken() ?? (await getAuthToken());
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  } else {
    headers["x-demo-id"] = getDemoId();
  }
  return headers;
}

export type ApiIdea = {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  platform: string;
  updatedAt: string;
  script?: string;
  thumbnail: string;
  videoUrl?: string;
  scheduledAt?: string;
};

function isIdeaStatus(value: string): value is IdeaStatus {
  return (STATUSES as string[]).includes(value);
}

function isPriority(value: string): value is Priority {
  return (PRIORITIES as string[]).includes(value);
}

export function ideaToApi(idea: Idea): ApiIdea {
  return {
    id: idea.id,
    title: idea.title,
    description: idea.description,
    status: idea.status,
    priority: idea.priority,
    platform: idea.platform,
    updatedAt: idea.updatedAt,
    script: idea.script,
    thumbnail: idea.thumbnail,
    videoUrl: idea.videoUrl,
    scheduledAt: idea.scheduledAt,
  };
}

export function ideaFromApi(raw: ApiIdea): Idea | null {
  if (!raw.id.trim() || !raw.title.trim()) return null;
  if (!isIdeaStatus(raw.status) || !isPriority(raw.priority)) return null;
  if (!isPlatform(raw.platform)) return null;

  return {
    id: raw.id,
    title: raw.title,
    description: raw.description,
    status: raw.status,
    priority: raw.priority,
    platform: raw.platform,
    updatedAt: raw.updatedAt,
    script: raw.script,
    thumbnail: raw.thumbnail,
    videoUrl: raw.videoUrl,
    scheduledAt: raw.scheduledAt,
  };
}

export async function fetchIdeasFromApi(): Promise<ApiIdea[]> {
  const res = await fetch(resolveIdeasUrl(), {
    headers: await requestHeaders(),
  });
  if (!res.ok) {
    throw new Error(`Failed to load ideas (${res.status})`);
  }
  const data = (await res.json()) as { ideas: ApiIdea[] };
  return data.ideas ?? [];
}

export async function syncIdeasToApi(ideas: ApiIdea[]): Promise<void> {
  const res = await fetch(resolveIdeasUrl(), {
    method: "PUT",
    headers: await requestHeaders(),
    body: JSON.stringify({ ideas }),
  });
  if (!res.ok) {
    throw new Error(`Failed to sync ideas (${res.status})`);
  }
}
