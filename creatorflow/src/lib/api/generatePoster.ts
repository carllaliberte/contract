import { peekAuthToken, getAuthToken } from "../auth/session";
import { resolveGenerateScriptUrl } from "./base";

const DEMO_ID_KEY = "cf-demo-id";
const TIMEOUT_MS = 12_000;
const cache = new Map<string, Blob>();
const inflight = new Map<string, Promise<Blob | null>>();

function posterUrl(): string {
  const script = resolveGenerateScriptUrl();
  return script.replace(/generate-script\/?$/, "generate-poster");
}

function keyFor(hook: string): string {
  return hook.trim().toLowerCase();
}

async function requestHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
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

async function loadPoster(hook: string): Promise<Blob | null> {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(posterUrl(), {
      method: "POST",
      headers: await requestHeaders(),
      body: JSON.stringify({ hook }),
      signal: controller.signal,
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { url?: string; b64?: string };
    if (data.b64) {
      const binary = atob(data.b64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
      return new Blob([bytes], { type: "image/png" });
    }
    if (data.url) {
      const image = await fetch(data.url, { signal: controller.signal });
      if (!image.ok) return null;
      return image.blob();
    }
    return null;
  } catch {
    return null;
  } finally {
    window.clearTimeout(timer);
  }
}

export async function fetchGeneratedPoster(hook: string): Promise<Blob | null> {
  const key = keyFor(hook);
  if (!key) return null;
  const hit = cache.get(key);
  if (hit) return hit;
  const pending = inflight.get(key);
  if (pending) return pending;

  const job = loadPoster(hook).then((blob) => {
    if (blob) cache.set(key, blob);
    inflight.delete(key);
    return blob;
  });
  inflight.set(key, job);
  return job;
}

export function prefetchPoster(hook: string): void {
  void fetchGeneratedPoster(hook);
}
