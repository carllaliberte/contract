import { peekAuthToken, getAuthToken } from "../auth/session";
import { resolveGenerateScriptUrl } from "./base";

const DEMO_ID_KEY = "cf-demo-id";
const TIMEOUT_MS = 120_000;
const cache = new Map<string, File>();
const missUntil = new Map<string, number>();

export function clampClipDuration(seconds: number): number {
  return Math.min(15, Math.max(6, Math.round(seconds)));
}

export function clipRequestKey(hook: string, duration: number, script: string): string {
  return `${clampClipDuration(duration)}:${hook.trim()}|${script.trim().slice(0, 200)}`;
}

function clipUrl(): string {
  const dedicated = import.meta.env.VITE_CLIP_URL as string | undefined;
  if (dedicated?.trim()) return dedicated.trim();
  const script = resolveGenerateScriptUrl();
  if (script.endsWith("/generate-script") || script.endsWith("/ai/generate-script")) {
    return script.replace(/generate-script\/?$/, "generate-clip");
  }
  return "/ai/generate-clip";
}

async function requestHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const anon = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
  if (anon) {
    headers.apikey = anon;
    headers.Authorization = `Bearer ${anon}`;
  }
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

async function loadClip(hook: string, duration: number, script: string): Promise<File | null> {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(clipUrl(), {
      method: "POST",
      headers: await requestHeaders(),
      body: JSON.stringify({
        hook,
        duration: clampClipDuration(duration),
        script: script.trim() || undefined,
      }),
      signal: controller.signal,
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { url?: string; b64?: string; mime?: string };
    if (data.b64) {
      const binary = atob(data.b64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
      return new File([bytes], "clapshot.mp4", { type: data.mime || "video/mp4" });
    }
    if (data.url) {
      const video = await fetch(data.url);
      if (!video.ok) return null;
      const blob = await video.blob();
      if (!blob.type.startsWith("video") && blob.size < 32) return null;
      return new File([blob], "clapshot.mp4", { type: blob.type || "video/mp4" });
    }
    return null;
  } catch {
    return null;
  } finally {
    window.clearTimeout(timer);
  }
}

export function prefetchGeneratedClip(
  hook: string,
  duration = 6,
  script = "",
): Promise<File | null> {
  return fetchGeneratedClipFile(hook, duration, script);
}

export async function fetchGeneratedClip(
  hook: string,
  duration = 6,
  script = "",
): Promise<string | null> {
  const clip = await fetchGeneratedClipFile(hook, duration, script);
  return clip ? URL.createObjectURL(clip) : null;
}

export async function fetchGeneratedClipFile(
  hook: string,
  duration = 6,
  script = "",
): Promise<File | null> {
  const key = clipRequestKey(hook, duration, script);
  const hit = cache.get(key);
  if (hit) return hit;
  const blocked = missUntil.get(key);
  if (blocked && blocked > Date.now()) return null;
  const pending = inflight.get(key);
  if (pending) return pending;
  const job = loadClip(hook, duration, script).then((file) => {
    if (file) cache.set(key, file);
    else missUntil.set(key, Date.now() + 20_000);
    inflight.delete(key);
    return file;
  });
  inflight.set(key, job);
  return job;
}
