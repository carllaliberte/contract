import { beforeEach, describe, expect, it } from "vitest";
import { Hono } from "hono";
import { createAuthRoutes } from "./auth.js";
import { createIapRoutes, clearMemoryIapPlans } from "./iap.js";
import { clearMemoryUsageStore } from "../services/aiUsage.js";

function mockSignedTransaction(input: {
  productId: string;
  bundleId?: string;
  originalTransactionId?: string;
  expiresDate?: number;
}): string {
  const header = Buffer.from(
    JSON.stringify({ alg: "ES256", x5c: [] }),
  ).toString("base64url");
  const payload = Buffer.from(
    JSON.stringify({
      bundleId: input.bundleId ?? "com.carllaliberte.creatorflow",
      productId: input.productId,
      originalTransactionId: input.originalTransactionId ?? "txn-123",
      transactionId: input.originalTransactionId ?? "txn-123",
      expiresDate:
        input.expiresDate ?? Date.now() + 30 * 24 * 60 * 60 * 1000,
      environment: "Sandbox",
    }),
  ).toString("base64url");
  return `${header}.${payload}.signature`;
}

describe("POST /auth/apple", () => {
  it("returns a memory-store session token", async () => {
    const app = new Hono();
    app.route("/auth", createAuthRoutes());

    const header = Buffer.from(JSON.stringify({ alg: "none" })).toString(
      "base64url",
    );
    const payload = Buffer.from(
      JSON.stringify({ sub: "apple-user-42" }),
    ).toString("base64url");
    const identityToken = `${header}.${payload}.sig`;

    const res = await app.request("/auth/apple", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        identityToken,
        user: "apple-user-42",
        email: "user@example.com",
      }),
    });

    expect(res.status).toBe(200);
    const data = (await res.json()) as {
      accessToken: string;
      userId: string;
      provider: string;
    };
    expect(data.provider).toBe("apple");
    expect(data.accessToken).toContain("apple.apple:apple-user-42");
    expect(data.userId).toBe("apple:apple-user-42");
  });
});

describe("POST /iap/apple/validate", () => {
  beforeEach(() => {
    clearMemoryUsageStore();
    clearMemoryIapPlans();
  });

  it("upgrades authenticated Apple user to pro", async () => {
    const app = new Hono();
    app.route("/iap", createIapRoutes());

    const res = await app.request("/iap/apple/validate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer apple.apple:iap-user",
      },
      body: JSON.stringify({
        productId: "cf_pro_monthly",
        signedTransaction: mockSignedTransaction({
          productId: "cf_pro_monthly",
        }),
      }),
    });

    expect(res.status).toBe(200);
    const data = (await res.json()) as { plan: string; usage: { plan: string } };
    expect(data.plan).toBe("pro");
    expect(data.usage.plan).toBe("pro");
  });

  it("rejects demo users", async () => {
    const app = new Hono();
    app.route("/iap", createIapRoutes());

    const res = await app.request("/iap/apple/validate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-demo-id": "guest",
      },
      body: JSON.stringify({
        productId: "cf_pro_monthly",
        signedTransaction: mockSignedTransaction({
          productId: "cf_pro_monthly",
        }),
      }),
    });

    expect(res.status).toBe(403);
  });
});
