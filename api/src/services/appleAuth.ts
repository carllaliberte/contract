import { createRemoteJWKSet, jwtVerify, type JWTPayload } from "jose";
import { createClient } from "@supabase/supabase-js";
import { env } from "../env.js";

const APPLE_JWKS = createRemoteJWKSet(
  new URL("https://appleid.apple.com/auth/keys"),
);

export type AppleIdentity = {
  sub: string;
  email?: string;
};

export type AppleAuthSession = {
  accessToken: string;
  userId: string;
  provider: "apple";
};

function parseAppleIdentity(payload: JWTPayload): AppleIdentity {
  const sub = payload.sub;
  if (!sub || typeof sub !== "string") {
    throw new Error("Apple identity token missing sub");
  }
  const email =
    typeof payload.email === "string" ? payload.email : undefined;
  return { sub, email };
}

export async function verifyAppleIdentityToken(
  identityToken: string,
): Promise<AppleIdentity> {
  if (env.mockAppleAuth) {
    const parts = identityToken.split(".");
    if (parts.length >= 2) {
      try {
        const payload = JSON.parse(
          Buffer.from(parts[1], "base64url").toString("utf8"),
        ) as JWTPayload;
        return parseAppleIdentity(payload);
      } catch {
        // fall through
      }
    }
    return { sub: identityToken.slice(0, 64) || "mock-apple-user" };
  }

  const { payload } = await jwtVerify(identityToken, APPLE_JWKS, {
    issuer: "https://appleid.apple.com",
    audience: env.appleClientId,
  });
  return parseAppleIdentity(payload);
}

function memoryAppleToken(userId: string): string {
  return `apple.${userId}`;
}

export function parseMemoryAppleToken(token: string): string | null {
  if (!token.startsWith("apple.")) return null;
  const userId = token.slice("apple.".length).trim();
  return userId || null;
}

export async function exchangeAppleIdentity(
  identityToken: string,
  profile?: {
    user?: string | null;
    email?: string | null;
    givenName?: string | null;
    familyName?: string | null;
  },
): Promise<AppleAuthSession> {
  const identity = await verifyAppleIdentityToken(identityToken);
  const appleSub = profile?.user ?? identity.sub;
  const email = profile?.email ?? identity.email ?? null;
  const displayName = [profile?.givenName, profile?.familyName]
    .filter(Boolean)
    .join(" ")
    .trim();

  if (env.memoryStore) {
    const userId = `apple:${appleSub}`;
    return {
      accessToken: memoryAppleToken(userId),
      userId,
      provider: "apple",
    };
  }

  if (!env.supabaseUrl || !env.supabaseAnonKey) {
    throw new Error("Supabase auth is not configured");
  }

  const authClient = createClient(env.supabaseUrl, env.supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data, error } = await authClient.auth.signInWithIdToken({
    provider: "apple",
    token: identityToken,
  });

  if (error || !data.session || !data.user) {
    throw new Error(error?.message ?? "Apple sign-in failed");
  }

  const admin = createClient(env.supabaseUrl, env.supabaseServiceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  if (displayName) {
    await admin
      .from("profiles")
      .update({ display_name: displayName })
      .eq("id", data.user.id);
  } else if (email) {
    await admin
      .from("profiles")
      .upsert({ id: data.user.id, display_name: email.split("@")[0] });
  }

  return {
    accessToken: data.session.access_token,
    userId: data.user.id,
    provider: "apple",
  };
}
