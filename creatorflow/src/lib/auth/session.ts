import { secureClear, secureGet, secureSet } from "../secureStorage";

export const SESSION_KEYS = {
  AUTH_TOKEN: "cf-auth-token",
  APPLE_USER: "cf-apple-user",
  SESSION_KIND: "cf-session-kind",
} as const;

export type SessionKind = "none" | "demo" | "apple";

const DEMO_FLAG = "cf-demo";

let cachedAuthToken: string | null | undefined;

export function peekAuthToken(): string | null {
  if (cachedAuthToken !== undefined) {
    return cachedAuthToken;
  }
  return null;
}

export async function getAuthToken(): Promise<string | null> {
  if (cachedAuthToken !== undefined) {
    return cachedAuthToken;
  }
  cachedAuthToken = await secureGet(SESSION_KEYS.AUTH_TOKEN);
  return cachedAuthToken;
}

export async function establishAppleSession(input: {
  accessToken: string;
  userId: string | null;
}): Promise<void> {
  await secureSet(SESSION_KEYS.AUTH_TOKEN, input.accessToken);
  await secureSet(SESSION_KEYS.SESSION_KIND, "apple");
  if (input.userId) {
    await secureSet(SESSION_KEYS.APPLE_USER, input.userId);
  }
  cachedAuthToken = input.accessToken;
  localStorage.removeItem(DEMO_FLAG);
}

export async function establishDemoSession(): Promise<void> {
  localStorage.setItem(DEMO_FLAG, "1");
  await secureSet(SESSION_KEYS.SESSION_KIND, "demo");
  cachedAuthToken = null;
  await secureRemoveTokenOnly();
}

async function secureRemoveTokenOnly(): Promise<void> {
  await secureClear([SESSION_KEYS.AUTH_TOKEN, SESSION_KEYS.APPLE_USER]);
}

export async function clearSession(): Promise<void> {
  cachedAuthToken = null;
  localStorage.removeItem(DEMO_FLAG);
  await secureClear(Object.values(SESSION_KEYS));
}

export async function resolveSessionKind(): Promise<SessionKind> {
  const [kind, token] = await Promise.all([
    secureGet(SESSION_KEYS.SESSION_KIND),
    getAuthToken(),
  ]);

  if (kind === "apple" && token) {
    return "apple";
  }

  if (localStorage.getItem(DEMO_FLAG) === "1" || kind === "demo") {
    return "demo";
  }

  return "none";
}
