import { Hono } from "hono";
import { cors } from "hono/cors";
import type { AuthVariables } from "../middleware/auth.js";
import { authMiddleware } from "../middleware/auth.js";
import { env } from "../env.js";

type AppEnv = { Variables: AuthVariables };

export function createProfileRoutes() {
  const profile = new Hono<AppEnv>();

  profile.use(
    "*",
    cors({
      origin: env.corsOrigins,
      allowHeaders: ["Content-Type", "Authorization", "x-demo-id"],
      allowMethods: ["GET", "OPTIONS"],
    }),
  );

  profile.use("*", authMiddleware);

  profile.get("/", async (c) => {
    const userId = c.get("userId");
    const usageStore = c.get("usageStore");
    const usage = await usageStore.getUsage(userId);

    return c.json({
      userId,
      plan: usage.plan,
      usage,
    });
  });

  return profile;
}
