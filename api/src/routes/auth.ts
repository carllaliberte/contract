import { Hono } from "hono";
import { cors } from "hono/cors";
import { env } from "../env.js";
import { exchangeAppleIdentity } from "../services/appleAuth.js";

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
    let body: unknown;
    try {
      body = await c.req.json();
    } catch {
      return c.json({ error: "BAD_REQUEST", message: "Invalid JSON body" }, 400);
    }

    const payload = body as Record<string, unknown>;
    const identityToken =
      typeof payload.identityToken === "string" ? payload.identityToken : "";
    if (!identityToken.trim()) {
      return c.json(
        { error: "BAD_REQUEST", message: "identityToken is required" },
        400,
      );
    }

    try {
      const session = await exchangeAppleIdentity(identityToken, {
        user: typeof payload.user === "string" ? payload.user : null,
        email: typeof payload.email === "string" ? payload.email : null,
        givenName:
          typeof payload.givenName === "string" ? payload.givenName : null,
        familyName:
          typeof payload.familyName === "string" ? payload.familyName : null,
      });

      return c.json({
        accessToken: session.accessToken,
        token: session.accessToken,
        userId: session.userId,
        provider: session.provider,
      });
    } catch (error) {
      console.error("auth/apple error:", error);
      return c.json(
        {
          error: "AUTH_FAILED",
          message:
            error instanceof Error
              ? error.message
              : "Apple authentication failed",
        },
        401,
      );
    }
  });

  return auth;
}
