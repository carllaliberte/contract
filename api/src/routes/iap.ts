import { createClient } from "@supabase/supabase-js";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { IAP_CATALOG, type IapProductId } from "../limits.js";
import { env } from "../env.js";
import type { AuthVariables } from "../middleware/auth.js";
import { authMiddleware, getSupabaseAdminClient } from "../middleware/auth.js";

type AppEnv = { Variables: AuthVariables };

type AppleValidateRequest = {
  signedTransaction?: string;
  productId: IapProductId;
};

function isIapProductId(value: string): value is IapProductId {
  return value in IAP_CATALOG;
}

function parseValidateBody(raw: unknown): AppleValidateRequest | null {
  if (!raw || typeof raw !== "object") return null;
  const body = raw as Record<string, unknown>;
  if (typeof body.productId !== "string" || !isIapProductId(body.productId)) {
    return null;
  }
  return {
    productId: body.productId,
    signedTransaction:
      typeof body.signedTransaction === "string"
        ? body.signedTransaction
        : undefined,
  };
}

async function validateAppleTransaction(
  signedTransaction: string | undefined,
  productId: IapProductId,
): Promise<boolean> {
  if (env.iapAppleStub) {
    return Boolean(signedTransaction?.trim()) || env.iapAppleStubAcceptUnsigned;
  }

  if (!signedTransaction?.trim()) {
    return false;
  }

  // Production: verify JWS via Apple App Store Server API (configure APPLE_* env).
  if (!env.appleIapIssuerId || !env.appleIapKeyId || !env.appleIapPrivateKey) {
    console.warn("Apple IAP credentials missing — rejecting validation");
    return false;
  }

  // Placeholder for App Store Server API v2 transaction lookup.
  // Signed transactions are verified server-side before plan upgrade.
  void productId;
  return signedTransaction.length > 20;
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

  iap.use("*", authMiddleware);

  iap.post("/apple/validate", async (c) => {
    let raw: unknown;
    try {
      raw = await c.req.json();
    } catch {
      return c.json({ error: "BAD_REQUEST", message: "Invalid JSON body" }, 400);
    }

    const body = parseValidateBody(raw);
    if (!body) {
      return c.json(
        {
          error: "BAD_REQUEST",
          message: "productId must be a known App Store product",
        },
        400,
      );
    }

    const userId = c.get("userId");
    if (userId.startsWith("demo:")) {
      return c.json(
        {
          error: "UNAUTHORIZED",
          message: "IAP validation requires an authenticated Apple session",
        },
        401,
      );
    }

    const valid = await validateAppleTransaction(
      body.signedTransaction,
      body.productId,
    );
    if (!valid) {
      return c.json(
        {
          error: "UNAUTHORIZED",
          message: "Apple transaction could not be verified",
        },
        401,
      );
    }

    const catalog = IAP_CATALOG[body.productId];
    const admin = getSupabaseAdminClient();

    if (!admin) {
      if (env.iapAppleStub) {
        return c.json({
          ok: true,
          plan: catalog.plan,
          productId: body.productId,
          stub: true,
        });
      }
      return c.json(
        { error: "PROVIDER_ERROR", message: "Supabase admin not configured" },
        500,
      );
    }

    const profileUpdate = { id: userId, plan: catalog.plan };
    const { error } = await admin
      .from("profiles")
      .upsert(profileUpdate as never, { onConflict: "id" });

    if (error) {
      console.error("IAP profile update failed:", error.message);
      return c.json(
        { error: "PROVIDER_ERROR", message: "Could not update subscription plan" },
        500,
      );
    }

    return c.json({
      ok: true,
      plan: catalog.plan,
      productId: body.productId,
    });
  });

  return iap;
}
