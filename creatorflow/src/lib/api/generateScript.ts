import type {
  GenerateScriptErrorBody,
  GenerateScriptRequest,
  GenerateScriptResponse,
} from "./types";

const DEMO_ID_KEY = "cf-demo-id";
const AUTH_TOKEN_KEY = "cf-auth-token";

export class GenerateScriptApiError extends Error {
  readonly code: GenerateScriptErrorBody["error"];
  readonly usage?: GenerateScriptErrorBody["usage"];

  constructor(body: GenerateScriptErrorBody) {
    super(body.message);
    this.name = "GenerateScriptApiError";
    this.code = body.error;
    this.usage = body.usage;
  }
}

function apiBaseUrl(): string {
  const base = import.meta.env.VITE_API_BASE_URL ?? "";
  return base.replace(/\/$/, "");
}

function getDemoId(): string {
  let id = localStorage.getItem(DEMO_ID_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(DEMO_ID_KEY, id);
  }
  return id;
}

function authHeaders(): Record<string, string> {
  const token = localStorage.getItem(AUTH_TOKEN_KEY);
  if (token) return { Authorization: `Bearer ${token}` };
  return { "x-demo-id": getDemoId() };
}

export async function postGenerateScript(
  payload: GenerateScriptRequest,
): Promise<GenerateScriptResponse> {
  const url = `${apiBaseUrl()}/api/ai/generate-script`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
    },
    body: JSON.stringify({
      ...payload,
      language: payload.language ?? "fr",
      mode: payload.mode ?? "generate",
    }),
  });

  const body = (await response.json().catch(() => null)) as
    | GenerateScriptResponse
    | GenerateScriptErrorBody
    | null;

  if (!response.ok) {
    if (body && "error" in body && body.error) {
      throw new GenerateScriptApiError(body);
    }
    throw new Error(`generate-script failed (${response.status})`);
  }

  if (!body || !("script" in body)) {
    throw new Error("generate-script returned an invalid payload");
  }

  return body;
}
