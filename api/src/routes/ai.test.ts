import { beforeEach, describe, expect, it } from "vitest";
import { Hono } from "hono";
import type { AuthVariables } from "../middleware/auth.js";
import { authMiddleware } from "../middleware/auth.js";
import { clearMemoryUsageStore } from "../services/aiUsage.js";
import { createAiRoutes } from "./ai.js";
import type { GenerateScriptResponse } from "../types.js";

type AppEnv = { Variables: AuthVariables };

function testApp() {
  const app = new Hono();
  app.route("/ai", createAiRoutes());
  return app;
}

describe("POST /ai/generate-script", () => {
  beforeEach(() => {
    clearMemoryUsageStore();
  });

  it("returns script, usage, and model", async () => {
    const app = testApp();
    const res = await app.request("/ai/generate-script", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-demo-id": "e2e",
      },
      body: JSON.stringify({
        ideaId: "id-1",
        title: "Mon titre",
        description: "Description test",
        platform: "youtube",
        language: "fr",
        mode: "generate",
      }),
    });

    expect(res.status).toBe(200);
    const data = (await res.json()) as GenerateScriptResponse;
    expect(data.script).toContain("Mon titre");
    expect(data.usage.short.count).toBe(1);
    expect(data.model).toBe("mock");
  });

  it("returns 400 for invalid body", async () => {
    const app = testApp();
    const res = await app.request("/ai/generate-script", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-demo-id": "e2e" },
      body: JSON.stringify({ ideaId: "x" }),
    });
    expect(res.status).toBe(400);
    const data = (await res.json()) as { error: string };
    expect(data.error).toBe("BAD_REQUEST");
  });

  it("returns 401 without auth", async () => {
    const app = new Hono();
    app.route("/ai", createAiRoutes());
    const res = await app.request("/ai/generate-script", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ideaId: "id-1",
        title: "T",
        description: "D",
        platform: "tiktok",
      }),
    });
    expect(res.status).toBe(401);
  });
});

describe("authMiddleware", () => {
  it("accepts x-demo-id", async () => {
    const app = new Hono<AppEnv>();
    app.use("*", authMiddleware);
    app.get("/who", (c) => c.json({ userId: c.get("userId") }));

    const res = await app.request("/who", {
      headers: { "x-demo-id": "abc-123" },
    });
    expect(res.status).toBe(200);
    const data = (await res.json()) as { userId: string };
    expect(data.userId).toBe("demo:abc-123");
  });
});
