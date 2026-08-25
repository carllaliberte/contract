import { createClient } from "@supabase/supabase-js";
import type { Context, Next } from "hono";
import { env } from "../env.js";
import {
  createSupabaseUsageStore,
  memoryUsageStore,
  type UsageStore,
} from "../services/aiUsage.js";

export type AuthVariables = {
  userId: string;
  usageStore: UsageStore;
};

type AppEnv = { Variables: AuthVariables };

let supabaseAdmin: ReturnType<typeof createClient> | null = null;

function getSupabaseAdmin() {
  if (!env.supabaseUrl || !env.supabaseServiceRoleKey) return null;
  if (!supabaseAdmin) {
    supabaseAdmin = createClient(env.supabaseUrl, env.supabaseServiceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return supabaseAdmin;
}

function getSupabaseAuthClient() {
  if (!env.supabaseUrl || !env.supabaseAnonKey) return null;
  return createClient(env.supabaseUrl, env.supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

async function resolveUsageStore(userId: string): Promise<UsageStore> {
  if (userId.startsWith("demo:") || env.memoryStore) {
    return memoryUsageStore;
  }

  const admin = getSupabaseAdmin();
  if (!admin) return memoryUsageStore;

  return createSupabaseUsageStore(admin);
}

export function getSupabaseAdminClient() {
  return getSupabaseAdmin();
}

export async function authMiddleware(c: Context<AppEnv>, next: Next) {
  const authHeader = c.req.header("Authorization");
  const demoId = c.req.header("x-demo-id");

  let userId: string | null = null;

  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7).trim();
    if (!token) {
      return c.json(
        { error: "UNAUTHORIZED", message: "Missing bearer token" },
        401,
      );
    }

    if (env.memoryStore && token === "demo") {
      userId = `demo:${demoId ?? "local"}`;
    } else {
      const authClient = getSupabaseAuthClient();
      if (!authClient) {
        return c.json(
          { error: "UNAUTHORIZED", message: "Supabase auth not configured" },
          401,
        );
      }
      const { data, error } = await authClient.auth.getUser(token);
      if (error || !data.user) {
        return c.json(
          { error: "UNAUTHORIZED", message: "Invalid or expired token" },
          401,
        );
      }
      userId = data.user.id;
    }
  } else if (demoId) {
    userId = `demo:${demoId}`;
  }

  if (!userId) {
    return c.json(
      {
        error: "UNAUTHORIZED",
        message: "Provide Authorization Bearer token or x-demo-id header",
      },
      401,
    );
  }

  c.set("userId", userId);
  c.set("usageStore", await resolveUsageStore(userId));
  await next();
}
