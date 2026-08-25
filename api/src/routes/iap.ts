import { Hono } from "hono";
import { cors } from "hono/cors";
import type { AuthVariables } from "../middleware/auth.js";
import { authMiddleware, getSupabaseAdminClient } from "../middleware/auth.js";
import { env } from "../env.js";
import { verifySignedTransaction } from "../services/appleIap.js";
import {
  applyVerifiedTransaction,
  downgradeExpiredSubscriptions,
} from "../services/profilePlan.js";
import { memoryUsageStore, setMemoryUserPlan } from "../services/aiUsage.js";

type AppEnv = { Variables: AuthVariables };

const memoryPlans = new Map<string, "free" | "pro">();

export function clearMemoryIapPlans(): void {
  memoryPlans.clear();
}

function applyMemoryPlan(userId: string, plan: "free" | "pro") {
  memoryPlans.set(userId, plan);
  setMemoryUserPlan(userId, plan);
}

export function createIapRoutes() {
  const iap = new Hono<AppEnv>();

  iap.use(
    "*",
    cors({
      origin: env.corsOrigins,
      allowHeaders: ["Content-Type", "Authorization", "x-demo-id"],
      allowMethods: ["POST", "OPTIONS"],
    }),
  );

  iap.post("/apple/notifications", async (c) => {
    let body: unknown;
    try {
      body = await c.req.json();
    } catch {
      return c.json({ error: "BAD_REQUEST" }, 400);
    }

    const signedPayload =
      typeof (body as { signedPayload?: string }).signedPayload === "string"
        ? (body as { signedPayload: string }).signedPayload
        : "";

    if (!signedPayload) {
      return c.json({ error: "BAD_REQUEST", message: "signedPayload required" }, 400);
    }

    if (env.memoryStore) {
      return c.json({ ok: true, mode: "memory" });
    }

    const admin = getSupabaseAdminClient();
    if (!admin) {
      return c.json({ error: "SERVER_ERROR" }, 500);
    }

    try {
      const { handleAppleServerNotification } = await import(
        "../services/appleNotifications.js"
      );
      await handleAppleServerNotification(admin, signedPayload);
      return c.json({ ok: true });
    } catch (error) {
      console.error("iap/apple/notifications error:", error);
      return c.json({ error: "PROCESSING_FAILED" }, 500);
    }
  });

  iap.use("*", authMiddleware);

  iap.post("/apple/validate", async (c) => {
    let body: unknown;
    try {
      body = await c.req.json();
    } catch {
      return c.json({ error: "BAD_REQUEST", message: "Invalid JSON body" }, 400);
    }

    const payload = body as Record<string, unknown>;
    const signedTransaction =
      typeof payload.signedTransaction === "string"
        ? payload.signedTransaction
        : "";
    const productId =
      typeof payload.productId === "string" ? payload.productId : "";

    if (!signedTransaction.trim() || !productId.trim()) {
      return c.json(
        {
          error: "BAD_REQUEST",
          message: "signedTransaction and productId are required",
        },
        400,
      );
    }

    const userId = c.get("userId");
    if (userId.startsWith("demo:")) {
      return c.json(
        {
          error: "FORBIDDEN",
          message: "Sign in with Apple to purchase CreatorFlow Pro",
        },
        403,
      );
    }

    try {
      const transaction = verifySignedTransaction(
        signedTransaction,
        productId,
      );

      if (env.memoryStore) {
        applyMemoryPlan(userId, "pro");
        const usage = await memoryUsageStore.getUsage(userId);
        return c.json({ plan: "pro", usage, productId: transaction.productId });
      }

      const admin = getSupabaseAdminClient();
      if (!admin) {
        return c.json(
          { error: "SERVER_ERROR", message: "Supabase admin not configured" },
          500,
        );
      }

      const plan = await applyVerifiedTransaction(admin, userId, transaction);
      const usageStore = c.get("usageStore");
      const usage = await usageStore.getUsage(userId);

      return c.json({
        plan,
        usage,
        productId: transaction.productId,
        expiresAt: transaction.expiresAt?.toISOString() ?? null,
      });
    } catch (error) {
      console.error("iap/apple/validate error:", error);
      return c.json(
        {
          error: "VALIDATION_FAILED",
          message:
            error instanceof Error
              ? error.message
              : "Transaction validation failed",
        },
        400,
      );
    }
  });

  iap.post("/apple/restore", async (c) => {
    let body: unknown;
    try {
      body = await c.req.json();
    } catch {
      return c.json({ error: "BAD_REQUEST", message: "Invalid JSON body" }, 400);
    }

    const payload = body as Record<string, unknown>;
    const signedTransaction =
      typeof payload.signedTransaction === "string"
        ? payload.signedTransaction
        : "";
    const productId =
      typeof payload.productId === "string" ? payload.productId : "";

    const userId = c.get("userId");
    if (userId.startsWith("demo:")) {
      return c.json(
        {
          error: "FORBIDDEN",
          message: "Sign in with Apple to restore purchases",
        },
        403,
      );
    }

    try {
      if (signedTransaction && productId) {
        const transaction = verifySignedTransaction(
          signedTransaction,
          productId,
        );

        if (env.memoryStore) {
          const active = transaction.expiresAt
            ? transaction.expiresAt.getTime() > Date.now()
            : true;
          const plan = active ? "pro" : "free";
          applyMemoryPlan(userId, plan);
          const usage = await memoryUsageStore.getUsage(userId);
          return c.json({
            plan,
            usage,
            activeProductId: active ? transaction.productId : null,
          });
        }

        const admin = getSupabaseAdminClient();
        if (!admin) {
          return c.json(
            { error: "SERVER_ERROR", message: "Supabase admin not configured" },
            500,
          );
        }

        const plan = await applyVerifiedTransaction(admin, userId, transaction);
        const usageStore = c.get("usageStore");
        const usage = await usageStore.getUsage(userId);
        return c.json({
          plan,
          usage,
          activeProductId: plan === "pro" ? transaction.productId : null,
        });
      }

      if (env.memoryStore) {
        const plan = memoryPlans.get(userId) ?? "free";
        applyMemoryPlan(userId, plan);
        const usage = await memoryUsageStore.getUsage(userId);
        return c.json({
          plan,
          usage,
          activeProductId: plan === "pro" ? productId || null : null,
        });
      }

      const admin = getSupabaseAdminClient();
      if (!admin) {
        return c.json(
          { error: "SERVER_ERROR", message: "Supabase admin not configured" },
          500,
        );
      }

      const plan = await downgradeExpiredSubscriptions(admin, userId);
      const usageStore = c.get("usageStore");
      const usage = await usageStore.getUsage(userId);
      const { data } = await admin
        .from("iap_subscriptions")
        .select("product_id, expires_at")
        .eq("user_id", userId)
        .order("expires_at", { ascending: false, nullsFirst: false })
        .limit(1)
        .maybeSingle();

      const activeProductId =
        plan === "pro" && data?.product_id ? data.product_id : null;

      return c.json({ plan, usage, activeProductId });
    } catch (error) {
      console.error("iap/apple/restore error:", error);
      return c.json(
        {
          error: "RESTORE_FAILED",
          message:
            error instanceof Error ? error.message : "Restore failed",
        },
        400,
      );
    }
  });

  return iap;
}
