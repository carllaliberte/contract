import { peekAuthToken, getAuthToken } from "../auth/session";

const DEMO_ID_KEY = "cf-demo-id";

export type GenerateTtsRequest = {
  text: string;
  voiceId: string;
  speed?: number;
};

export function resolveGenerateTtsUrl(): string {
  const configured = import.meta.env.VITE_API_URL?.trim() ?? "";
  if (!configured) return "/ai/tts";
  if (configured.endsWith("/tts") || configured.endsWith("/ai/tts")) {
    return configured;
  }
  return `${configured.replace(/\/$/, "")}/ai/tts`;
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

export async function fetchTtsBlob(
  text: string,
  voiceId: string,
  speed = 1,
): Promise<Blob> {
  const res = await fetch(resolveGenerateTtsUrl(), {
    method: "POST",
    headers: await requestHeaders(),
    body: JSON.stringify({ text, voiceId, speed }),
  });

  if (!res.ok) {
    let message = `TTS API error (${res.status})`;
    try {
      const data = (await res.json()) as { message?: string };
      if (data.message) message = data.message;
    } catch {
      // Response body is not JSON (e.g. empty error page).
    }
    throw new Error(message);
  }

  return res.blob();
}
