import { useCallback, useState } from "react";
import { exchangeAppleSession } from "../lib/api/auth";
import { establishAppleSession } from "../lib/auth/session";
import { isNativePlatform } from "../lib/platform";

export interface AppleSignInResult {
  user: string | null;
  email: string | null;
  givenName: string | null;
  familyName: string | null;
  identityToken: string;
  authorizationCode: string;
}

export type AppleSignInStatus = "idle" | "loading" | "unavailable" | "error";

const APPLE_CLIENT_ID = "com.carllaliberte.creatorflow";
const APPLE_REDIRECT_URI = "https://carllaliberte.github.io/contract/creatorflow/auth/apple";

/**
 * Sign in with Apple on native iOS.
 * identityToken is exchanged server-side (stub when backend unavailable).
 */
export function useAppleSignIn() {
  const available = isNativePlatform();
  const [status, setStatus] = useState<AppleSignInStatus>(available ? "idle" : "unavailable");
  const [error, setError] = useState<string | null>(null);

  const signIn = useCallback(async (): Promise<boolean> => {
    if (!available) {
      setError("Sign in with Apple is only available on native apps");
      setStatus("unavailable");
      return false;
    }

    setStatus("loading");
    setError(null);

    try {
      const { SignInWithApple } = await import("@capacitor-community/apple-sign-in");
      const result = await SignInWithApple.authorize({
        clientId: APPLE_CLIENT_ID,
        redirectURI: APPLE_REDIRECT_URI,
        scopes: "email name",
      });

      const response = result.response;
      const payload: AppleSignInResult = {
        user: response.user ?? null,
        email: response.email ?? null,
        givenName: response.givenName ?? null,
        familyName: response.familyName ?? null,
        identityToken: response.identityToken,
        authorizationCode: response.authorizationCode,
      };

      const session = await exchangeAppleSession(payload);
      const displayName = [payload.givenName, payload.familyName]
        .filter(Boolean)
        .join(" ")
        .trim();
      await establishAppleSession({
        accessToken: session.accessToken,
        userId: session.userId ?? payload.user,
        displayName: displayName || null,
        email: payload.email,
      });

      setStatus("idle");
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Apple sign-in failed";
      setError(message);
      setStatus("error");
      return false;
    }
  }, [available]);

  return {
    signIn,
    available,
    status,
    error,
    isLoading: status === "loading",
  };
}
