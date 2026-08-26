import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { env } from "./env.js";
import { createAiRoutes } from "./routes/ai.js";
import { createAuthRoutes } from "./routes/auth.js";

const app = new Hono();

app.get("/health", (c) =>
  c.json({
    ok: true,
    memoryStore: env.memoryStore,
    mockLlm: env.mockLlm,
    appleAuthStub: env.appleAuthStub,
  }),
);

app.route("/auth", createAuthRoutes());
app.route("/ai", createAiRoutes());

serve({ fetch: app.fetch, port: env.port }, (info) => {
  console.log(`CreatorFlow API listening on http://localhost:${info.port}`);
});
