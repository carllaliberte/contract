import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Hono } from "hono";

describe("POST /auth/apple", () => {
  beforeEach(() => {
    vi.resetModules();
    process.env.APPLE_AUTH_STUB = "true";
  });

  afterEach(() => {
    delete process.env.APPLE_AUTH_STUB;
    vi.resetModules();
  });

  it("returns dev stub when APPLE_AUTH_STUB=true and identityToken is provided", async () => {
    const { createAuthRoutes } = await import("./auth.js");
    const app = new Hono();
    app.route("/auth", createAuthRoutes());

    const res = await app.request("/auth/apple", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        identityToken: "header.payload.signature",
        user: "apple-user-123",
      }),
    });

    expect(res.status).toBe(200);
    const data = (await res.json()) as {
      accessToken: string;
      userId: string;
      provider: string;
    };
    expect(data.provider).toBe("apple");
    expect(data.accessToken).toContain("stub.apple.");
    expect(data.userId).toBe("apple-user-123");
  });

  it("returns 400 without identityToken", async () => {
    const { createAuthRoutes } = await import("./auth.js");
    const app = new Hono();
    app.route("/auth", createAuthRoutes());

    const res = await app.request("/auth/apple", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user: "x" }),
    });

    expect(res.status).toBe(400);
  });

  it("returns 401 for invalid token when stub is off", async () => {
    delete process.env.APPLE_AUTH_STUB;
    vi.resetModules();

    const { createAuthRoutes } = await import("./auth.js");
    const app = new Hono();
    app.route("/auth", createAuthRoutes());

    const res = await app.request("/auth/apple", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        identityToken: "not-a-valid-jwt",
        user: "apple-user-123",
      }),
    });

    expect(res.status).toBe(401);
  });
});
