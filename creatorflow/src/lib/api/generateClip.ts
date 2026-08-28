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
  try {
    const res = await fetch(clipUrl(), {
      method: "POST",
      headers: await requestHeaders(),
      body: JSON.stringify({
        hook,
        duration: clampClipDuration(duration),
        script: script.trim() || undefined,
      }),
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
      return new File([blob], "clapshot.mp4", { type: blob.type || "video/mp4" });
    }
    return null;
  } catch {
    return null;
  }
}
