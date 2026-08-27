import { secureClear, secureGet, secureSet } from "../secureStorage";

export const SESSION_KEYS = {
  AUTH_TOKEN: "cf-auth-token",
  APPLE_USER: "cf-apple-user",
  APPLE_DISPLAY_NAME: "cf-apple-display-name",
  APPLE_EMAIL: "cf-apple-email",
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

export type AppleProfile = {
  userId: string | null;
  displayName: string | null;
  email: string | null;
};

export async function establishAppleSession(input: {
  accessToken: string;
  userId: string | null;
  displayName?: string | null;
  email?: string | null;
}): Promise<void> {
  await secureSet(SESSION_KEYS.AUTH_TOKEN, input.accessToken);
  await secureSet(SESSION_KEYS.SESSION_KIND, "apple");
  if (input.userId) {
    await secureSet(SESSION_KEYS.APPLE_USER, input.userId);
  }
  if (input.displayName) {
    await secureSet(SESSION_KEYS.APPLE_DISPLAY_NAME, input.displayName);
  } else {
    await secureClear([SESSION_KEYS.APPLE_DISPLAY_NAME]);
  }
  if (input.email) {
    await secureSet(SESSION_KEYS.APPLE_EMAIL, input.email);
  } else {
    await secureClear([SESSION_KEYS.APPLE_EMAIL]);
  }
  cachedAuthToken = input.accessToken;
  localStorage.removeItem(DEMO_FLAG);
}

export async function getAppleProfile(): Promise<AppleProfile> {
  const [userId, displayName, email] = await Promise.all([
    secureGet(SESSION_KEYS.APPLE_USER),
    secureGet(SESSION_KEYS.APPLE_DISPLAY_NAME),
    secureGet(SESSION_KEYS.APPLE_EMAIL),
  ]);
  return { userId, displayName, email };
}

export async function establishDemoSession(): Promise<void> {
  localStorage.setItem(DEMO_FLAG, "1");
  await secureSet(SESSION_KEYS.SESSION_KIND, "demo");
  cachedAuthToken = null;
  await secureRemoveTokenOnly();
}

async function secureRemoveTokenOnly(): Promise<void> {
  await secureClear([
    SESSION_KEYS.AUTH_TOKEN,
    SESSION_KEYS.APPLE_USER,
    SESSION_KEYS.APPLE_DISPLAY_NAME,
    SESSION_KEYS.APPLE_EMAIL,
  ]);
}

export async function clearSession(): Promise<void> {
  cachedAuthToken = null;
  localStorage.removeItem(DEMO_FLAG);
  await secureClear(Object.values(SESSION_KEYS));
}

/** App data keys in localStorage (not Keychain). Locale is preserved. */
const LOCAL_APP_DATA_KEYS = [
  DEMO_FLAG,
  "cf-ideas",
  "cf-cloud-queue",
  "cf-ai-usage",
  "cf-plan",
  "cf-demo-id",
] as const;

/**
 * Account deletion (Guideline 5.1.1(v)): wipe on-device app data and sign out.
 */
export async function deleteAccount(): Promise<void> {
  for (const key of LOCAL_APP_DATA_KEYS) {
    localStorage.removeItem(key);
  }
  await clearSession();
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
