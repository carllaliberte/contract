import { createClient } from "@supabase/supabase-js";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { env } from "../env.js";
import { verifyAppleIdentityToken } from "../services/appleAuth.js";

type AppleAuthRequest = {
  identityToken?: string;
  authorizationCode?: string;
  user?: string | null;
  email?: string | null;
  givenName?: string | null;
  familyName?: string | null;
};

function parseAppleBody(raw: unknown): AppleAuthRequest | null {
  if (!raw || typeof raw !== "object") return null;
  const body = raw as Record<string, unknown>;
  if (typeof body.identityToken !== "string" || !body.identityToken.trim()) {
    return null;
  }
  return {
    identityToken: body.identityToken.trim(),
    authorizationCode:
      typeof body.authorizationCode === "string"
        ? body.authorizationCode
        : undefined,
    user: typeof body.user === "string" ? body.user : null,
    email: typeof body.email === "string" ? body.email : null,
    givenName: typeof body.givenName === "string" ? body.givenName : null,
    familyName: typeof body.familyName === "string" ? body.familyName : null,
  };
}

function displayName(body: AppleAuthRequest): string | null {
  const name = [body.givenName, body.familyName].filter(Boolean).join(" ").trim();
  return name || null;
}

function shouldUseAuthStub(): boolean {
  return env.appleAuthStub || !env.supabaseUrl || !env.supabaseAnonKey;
}

function stubSession(body: AppleAuthRequest) {
  const userId = body.user ?? "anonymous";
  return {
    accessToken: `stub.apple.${userId}`,
    userId,
    provider: "apple" as const,
  };
}

export function createAuthRoutes() {
  const auth = new Hono();

  auth.use(
    "*",
    cors({
      origin: env.corsOrigins,
      allowHeaders: ["Content-Type"],
      allowMethods: ["POST", "OPTIONS"],
    }),
  );

  auth.post("/apple", async (c) => {
    let raw: unknown;
    try {
      raw = await c.req.json();
    } catch {
      return c.json({ error: "BAD_REQUEST", message: "Invalid JSON body" }, 400);
    }

    const body = parseAppleBody(raw);
    if (!body) {
      return c.json(
        { error: "BAD_REQUEST", message: "identityToken is required" },
        400,
      );
    }

    if (shouldUseAuthStub()) {
      return c.json(stubSession(body));
    }

    try {
      const verified = await verifyAppleIdentityToken(
        body.identityToken!,
        env.appleClientIds,
      );

      const supabase = createClient(env.supabaseUrl, env.supabaseAnonKey, {
        auth: { persistSession: false, autoRefreshToken: false },
      });

      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: "apple",
        token: body.identityToken!,
      });

      if (error || !data.session?.access_token) {
        console.error("Apple signInWithIdToken failed:", error?.message);
        return c.json(
          {
            error: "UNAUTHORIZED",
            message: "Apple identity could not be exchanged for a session",
          },
          401,
        );
      }

      const userId = data.user?.id ?? verified.sub;
      const name = displayName(body);

      if (env.supabaseServiceRoleKey) {
        const admin = createClient(
          env.supabaseUrl,
          env.supabaseServiceRoleKey,
          { auth: { persistSession: false, autoRefreshToken: false } },
        );
        await admin.from("profiles").upsert(
          {
            id: userId,
            display_name: name,
          },
          { onConflict: "id" },
        );
      }

      return c.json({
        accessToken: data.session.access_token,
        userId,
        provider: "apple",
      });
    } catch (error) {
      console.error("Apple auth error:", error);
      return c.json(
        {
          error: "UNAUTHORIZED",
          message:
            error instanceof Error
              ? error.message
              : "Apple identity token verification failed",
        },
        401,
      );
    }
  });

  return auth;
}
