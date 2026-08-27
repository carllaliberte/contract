import { peekAuthToken, getAuthToken } from "../auth/session";
import { resolveGenerateScriptUrl } from "./base";
import type {
  GenerateScriptErrorBody,
  GenerateScriptRequest,
  GenerateScriptResponse,
} from "./types";

const DEMO_ID_KEY = "cf-demo-id";

export { resolveGenerateScriptUrl } from "./base";

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

export async function postGenerateScript(
  payload: GenerateScriptRequest,
): Promise<GenerateScriptResponse> {
  const res = await fetch(resolveGenerateScriptUrl(), {
    method: "POST",
    headers: await requestHeaders(),
    body: JSON.stringify({
      ideaId: payload.ideaId,
      title: payload.title,
      description: payload.description,
      platform: payload.platform,
      language: payload.language ?? "fr",
      mode: payload.mode ?? "generate",
      existingScript: payload.existingScript,
      format: payload.format ?? "short",
      durationMinutes: payload.durationMinutes,
      styleContext: payload.styleContext,
    }),
  });

  let data: GenerateScriptResponse | GenerateScriptErrorBody;
  try {
    data = (await res.json()) as GenerateScriptResponse | GenerateScriptErrorBody;
  } catch {
    throw {
      error: "PROVIDER_ERROR",
      message: `API error (${res.status})`,
    } satisfies GenerateScriptErrorBody;
  }

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
