import { Capacitor } from "@capacitor/core";
import type { AppleSignInResult } from "../../hooks/useAppleSignIn";
import { resolveAppleAuthUrl } from "./base";

export interface AuthSession {
  accessToken: string;
  userId: string | null;
  provider: "apple";
}

function shouldUseAuthStub(): boolean {
  // Native iOS/Android builds must never use stub auth (App Store / Play review).
  if (Capacitor.isNativePlatform()) return false;
  if (import.meta.env.VITE_AUTH_STUB === "true") return true;
  if (import.meta.env.DEV && !import.meta.env.VITE_API_URL?.trim()) return true;
  return false;
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
    } else if (!shouldUseAuthStub()) {
      throw new Error("Apple authentication backend unavailable");
    }
  } catch (error) {
    if (!shouldUseAuthStub()) {
      throw error instanceof Error
        ? error
        : new Error("Apple authentication backend unavailable");
    }
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
