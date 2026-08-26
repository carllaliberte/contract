import { Capacitor } from "@capacitor/core";
import type { AppleSignInResult } from "../../hooks/useAppleSignIn";

export interface AuthSession {
  accessToken: string;
  userId: string | null;
  provider: "apple";
}

function resolveAppleAuthUrl(): string {
  const dedicated = import.meta.env.VITE_AUTH_APPLE_URL?.trim();
  if (dedicated) return dedicated;

  const apiBase = import.meta.env.VITE_API_URL?.trim();
  if (apiBase) {
    return `${apiBase.replace(/\/$/, "")}/auth/apple`;
  }

  return "/auth/apple";
}

function shouldUseAuthStub(): boolean {
  // Native iOS/Android builds must never use stub auth (App Store / Play review).
  if (Capacitor.isNativePlatform()) return false;
  if (import.meta.env.VITE_AUTH_STUB === "true") return true;
  if (import.meta.env.DEV) return true;
  return !import.meta.env.VITE_API_URL?.trim();
}

/**
 * Exchange Sign in with Apple credentials for an app session JWT.
 * P0: calls backend when configured; otherwise returns a documented dev stub.
 */
export async function exchangeAppleSession(
  payload: AppleSignInResult,
): Promise<AuthSession> {
  const url = resolveAppleAuthUrl();

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        identityToken: payload.identityToken,
        authorizationCode: payload.authorizationCode,
        user: payload.user,
        email: payload.email,
        givenName: payload.givenName,
        familyName: payload.familyName,
      }),
    });

    if (response.ok) {
      const data = (await response.json()) as {
        accessToken?: string;
        token?: string;
        userId?: string | null;
      };
      const accessToken = data.accessToken ?? data.token;
      if (accessToken) {
        return {
          accessToken,
          userId: data.userId ?? payload.user,
          provider: "apple",
        };
      }
    }
  } catch {
    // Fall through to stub when backend is not ready.
  }

  if (shouldUseAuthStub()) {
    return {
      accessToken: `stub.apple.${payload.user ?? "anonymous"}`,
      userId: payload.user,
      provider: "apple",
    };
  }

  throw new Error("Apple authentication backend unavailable");
}
