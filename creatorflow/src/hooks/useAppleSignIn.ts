import { useCallback, useState } from "react";
import { isNativeIos } from "../lib/platform";

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
 * P0 — prépare Sign in with Apple sur iOS natif (Capacitor).
 * L’échange identityToken → session JWT arrive en phase P1 (auth backend).
 */
export function useAppleSignIn() {
  const available = isNativeIos();
  const [status, setStatus] = useState<AppleSignInStatus>(available ? "idle" : "unavailable");
  const [error, setError] = useState<string | null>(null);

  const signIn = useCallback(async (): Promise<AppleSignInResult | null> => {
    if (!available) {
      setError("Sign in with Apple is only available on iOS");
      setStatus("unavailable");
      return null;
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

      // P1: POST identityToken to backend — P0 stores only a client marker
      if (payload.user) {
        localStorage.setItem("cf-apple-user", payload.user);
      }

      setStatus("idle");
      return payload;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Apple sign-in failed";
      setError(message);
      setStatus("error");
      return null;
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
