import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { env } from "./env.js";
import { createAiRoutes } from "./routes/ai.js";
import { createAuthRoutes } from "./routes/auth.js";

const app = new Hono();

app.use(
  "*",
  cors({
    origin: env.corsOrigins,
    allowHeaders: ["Content-Type", "Authorization", "x-demo-id"],
    allowMethods: ["GET", "POST", "OPTIONS"],
  }),
);

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

serve(
  { fetch: app.fetch, port: env.port, hostname: "0.0.0.0" },
  (info) => {
    console.log(`CreatorFlow API listening on http://0.0.0.0:${info.port}`);
  },
);
