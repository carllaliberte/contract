import { peekAuthToken, getAuthToken } from "../auth/session";
import { resolveGenerateScriptUrl } from "./base";

const DEMO_ID_KEY = "cf-demo-id";

function clipUrl(): string {
  return resolveGenerateScriptUrl().replace(/generate-script\/?$/, "generate-clip");
}

async function requestHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const token = peekAuthToken() ?? (await getAuthToken());
  if (token) headers.Authorization = `Bearer ${token}`;
  else {
    let id = localStorage.getItem(DEMO_ID_KEY);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(DEMO_ID_KEY, id);
    }
    headers["x-demo-id"] = id;
  }
  return headers;
}

export function clampClipDuration(seconds: number): number {
  return Math.min(15, Math.max(6, Math.round(seconds)));
}

export async function fetchGeneratedClip(
  hook: string,
  duration = 6,
): Promise<string | null> {
  try {
    const res = await fetch(clipUrl(), {
      method: "POST",
      headers: await requestHeaders(),
      body: JSON.stringify({ hook, duration: clampClipDuration(duration) }),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { url?: string };
    return data.url ?? null;
  } catch {
    return null;
  }
}
