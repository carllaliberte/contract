import { peekAuthToken, getAuthToken } from "../auth/session";

const DEMO_ID_KEY = "cf-demo-id";

export function resolveApiBase(): string {
  const configured = import.meta.env.VITE_API_URL?.trim() ?? "";
  if (!configured) return "";
  return configured.replace(/\/$/, "");
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
