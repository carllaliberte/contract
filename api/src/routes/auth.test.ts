import { beforeEach, describe, expect, it } from "vitest";
import { Hono } from "hono";
import { createAuthRoutes } from "./auth.js";

describe("POST /auth/apple", () => {
  it("returns dev stub when identityToken is provided", async () => {
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
    const app = new Hono();
    app.route("/auth", createAuthRoutes());

    const res = await app.request("/auth/apple", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user: "x" }),
    });

    expect(res.status).toBe(400);
  });
});
