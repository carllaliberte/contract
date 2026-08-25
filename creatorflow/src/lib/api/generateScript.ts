import type {
  GenerateScriptErrorBody,
  GenerateScriptRequest,
  GenerateScriptResponse,
} from "./types";

const DEMO_ID_KEY = "cf-demo-id";
const AUTH_TOKEN_KEY = "cf-auth-token";

function apiUrl(): string {
  const base = import.meta.env.VITE_API_URL ?? "";
  return `${base.replace(/\/$/, "")}/ai/generate-script`;
}

function getDemoId(): string {
  let id = localStorage.getItem(DEMO_ID_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(DEMO_ID_KEY, id);
  }
  return id;
}

function requestHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  const token = localStorage.getItem(AUTH_TOKEN_KEY);
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  } else {
    headers["x-demo-id"] = getDemoId();
  }
  return headers;
}

export async function postGenerateScript(
  payload: GenerateScriptRequest,
): Promise<GenerateScriptResponse> {
  const res = await fetch(apiUrl(), {
    method: "POST",
    headers: requestHeaders(),
    body: JSON.stringify({
      ideaId: payload.ideaId,
      title: payload.title,
      description: payload.description,
      platform: payload.platform,
      language: payload.language ?? "fr",
      mode: payload.mode ?? "generate",
      existingScript: payload.existingScript,
    }),
  });

  const data = (await res.json()) as GenerateScriptResponse | GenerateScriptErrorBody;

  if (!res.ok) {
    throw data;
  }

  return data as GenerateScriptResponse;
}

export function isGenerateScriptError(
  error: unknown,
): error is GenerateScriptErrorBody {
  return (
    typeof error === "object" &&
    error !== null &&
    "error" in error &&
    typeof (error as GenerateScriptErrorBody).error === "string"
  );
}
