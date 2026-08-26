import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { exchangeAppleSession } from "../lib/api/auth";
import { establishAppleSession } from "../lib/auth/session";
import { useI18n } from "../i18n/context";

/**
 * Handles the Sign in with Apple redirect for the web Services ID flow.
 * Registered return URL: https://carllaliberte.github.io/contract/creatorflow/auth/apple
 */
export function AppleAuthCallbackPage() {
  const { tr } = useI18n();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const params = new URLSearchParams(window.location.search);
      const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
      const code = params.get("code") ?? hash.get("code");
      const idToken = params.get("id_token") ?? hash.get("id_token");
      const userRaw = params.get("user") ?? hash.get("user");

      if (!code && !idToken) {
        if (!cancelled) {
          setError(tr("login.appleCallbackMissing"));
        }
        return;
      }

      let givenName: string | null = null;
      let familyName: string | null = null;
      let email: string | null = null;
      let user: string | null = null;

      if (userRaw) {
        try {
          const parsed = JSON.parse(userRaw) as {
            email?: string;
            name?: { firstName?: string; lastName?: string };
          };
          email = parsed.email ?? null;
          givenName = parsed.name?.firstName ?? null;
          familyName = parsed.name?.lastName ?? null;
        } catch {
          // Ignore malformed user payload.
        }
      }

      try {
        const session = await exchangeAppleSession({
          user,
          email,
          givenName,
          familyName,
          identityToken: idToken ?? "",
          authorizationCode: code ?? "",
        });

        const displayName = [givenName, familyName].filter(Boolean).join(" ").trim();
        await establishAppleSession({
          accessToken: session.accessToken,
          userId: session.userId ?? user,
          displayName: displayName || null,
          email,
        });

        if (!cancelled) {
          navigate("/app", { replace: true });
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : tr("login.appleCallbackError"));
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [navigate, tr]);

  return (
    <div className="flex min-h-dvh items-center justify-center px-6 text-center">
      <div className="max-w-sm">
        {error ? (
          <>
            <p className="text-sm text-destructive">{error}</p>
            <button
              type="button"
              className="mt-4 text-sm font-semibold text-primary hover:underline"
              onClick={() => navigate("/", { replace: true })}
            >
              {tr("login.appleCallbackBack")}
            </button>
          </>
        ) : (
          <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" aria-hidden />
            {tr("login.appleCallbackLoading")}
          </div>
        )}
      </div>
    </div>
  );
}
