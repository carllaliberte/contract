import { peekAuthToken, getAuthToken } from "../auth/session";
import { resolveGenerateScriptUrl } from "./base";

const DEMO_ID_KEY = "cf-demo-id";

function posterUrl(): string {
  const script = resolveGenerateScriptUrl();
  return script.replace(/generate-script\/?$/, "generate-poster");
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

export async function fetchGeneratedPoster(hook: string): Promise<Blob | null> {
  try {
    const res = await fetch(posterUrl(), {
      method: "POST",
      headers: await requestHeaders(),
      body: JSON.stringify({ hook }),
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
      const image = await fetch(data.url);
      if (!image.ok) return null;
      return image.blob();
    }
    return null;
  } catch {
    return null;
  }
}
