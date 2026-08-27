import { useCallback, useEffect, useState } from "react";
import { exchangeAppleSession } from "../lib/api/auth";
import { establishAppleSession } from "../lib/auth/session";
import { isNativePlatform } from "../lib/platform";
import { ROUTER_BASENAME } from "../lib/router";

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

type AppleAuthResponse = {
  authorization?: {
    id_token?: string;
    code?: string;
    state?: string;
  };
  user?: {
    email?: string;
    name?: { firstName?: string; lastName?: string };
  };
};

declare global {
  interface Window {
    AppleID?: {
      auth: {
        init: (config: Record<string, unknown>) => void;
        signIn: () => Promise<AppleAuthResponse>;
      };
    };
  }
}

function resolveWebRedirectUri(): string {
  if (typeof window === "undefined") return APPLE_REDIRECT_URI;
  const origin = window.location.origin;
  const base = ROUTER_BASENAME === "/" ? "" : ROUTER_BASENAME;
  return `${origin}${base}/auth/apple`;
}

async function loadAppleJs(): Promise<void> {
  if (window.AppleID) return;

  await new Promise<void>((resolve, reject) => {
    const existing = document.querySelector('script[data-appleid-auth="true"]');
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("Apple JS failed to load")), {
        once: true,
      });
      return;
    }

    const script = document.createElement("script");
    script.src =
      "https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js";
    script.async = true;
    script.dataset.appleidAuth = "true";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Apple JS failed to load"));
    document.head.appendChild(script);
  });
}

/**
 * Sign in with Apple on native (Capacitor) or web (Apple JS redirect flow).
 */
export function useAppleSignIn() {
  const native = isNativePlatform();
  const webAvailable = typeof window !== "undefined";
  const available = native || webAvailable;
  const [status, setStatus] = useState<AppleSignInStatus>(available ? "idle" : "unavailable");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (native || !webAvailable) return;

    void loadAppleJs()
      .then(() => {
        window.AppleID?.auth.init({
          clientId: APPLE_CLIENT_ID,
          scope: "name email",
          redirectURI: resolveWebRedirectUri(),
          usePopup: false,
        });
      })
      .catch(() => {
        // Web SDK is optional; native remains the primary path.
      });
  }, [native, webAvailable]);

  const signIn = useCallback(async (): Promise<boolean> => {
    if (!available) {
      setError("Sign in with Apple is unavailable on this device");
      setStatus("unavailable");
      return false;
    }

    setStatus("loading");
    setError(null);

    try {
      if (native) {
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
      }

      await loadAppleJs();
      if (!window.AppleID) {
        throw new Error("Apple Sign In is not available in this browser");
      }

      window.AppleID.auth.init({
        clientId: APPLE_CLIENT_ID,
        scope: "name email",
        redirectURI: resolveWebRedirectUri(),
        usePopup: false,
      });

      await window.AppleID.auth.signIn();
      return false;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Apple sign-in failed";
      setError(message);
      setStatus("error");
      return false;
    }
  }, [available, native]);

  return {
    signIn,
    available,
    status,
    error,
    isLoading: status === "loading",
    isNative: native,
  };
}
