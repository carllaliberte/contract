import { Hono } from "hono";
import { cors } from "hono/cors";
import type { AuthVariables } from "../middleware/auth.js";
import { authMiddleware } from "../middleware/auth.js";
import { env } from "../env.js";
import {
  assertCanGenerate,
  type UsageStore,
} from "../services/aiUsage.js";
import { generateScriptWithLlm } from "../services/llm.js";
import {
  isGenerateMode,
  isLanguage,
  isPlatform,
  type GenerateScriptErrorBody,
  type GenerateScriptRequest,
} from "../types.js";

type AppEnv = { Variables: AuthVariables };

function parseBody(raw: unknown): GenerateScriptRequest | null {
  if (!raw || typeof raw !== "object") return null;
  const b = raw as Record<string, unknown>;
  if (typeof b.ideaId !== "string" || !b.ideaId.trim()) return null;
  if (typeof b.title !== "string" || !b.title.trim()) return null;
  if (typeof b.description !== "string") return null;
  if (typeof b.platform !== "string" || !isPlatform(b.platform)) return null;
  return {
    ideaId: b.ideaId.trim(),
    title: b.title.trim(),
    description: b.description,
    platform: b.platform,
    language:
      typeof b.language === "string" && isLanguage(b.language)
        ? b.language
        : "fr",
    mode:
      typeof b.mode === "string" && isGenerateMode(b.mode) ? b.mode : "generate",
    existingScript:
      typeof b.existingScript === "string" ? b.existingScript : undefined,
  };
}

function limitError(
  usage: { count: number; limit: number; remaining: number },
): GenerateScriptErrorBody {
  return {
    error: "LIMIT_REACHED",
    message: "Monthly AI generation limit reached",
    usage,
  };
}

export function createAiRoutes() {
  const ai = new Hono<AppEnv>();

  ai.use(
    "*",
    cors({
      origin: env.corsOrigins,
      allowHeaders: ["Content-Type", "Authorization", "x-demo-id"],
      allowMethods: ["POST", "OPTIONS"],
    }),
  );

  ai.use("*", authMiddleware);

  ai.post("/generate-script", async (c) => {
    let body: unknown;
    try {
      body = await c.req.json();
    } catch {
      return c.json(
        { error: "BAD_REQUEST", message: "Invalid JSON body" },
        400,
      );
    }

    const payload = parseBody(body);
    if (!payload) {
      return c.json(
        {
          error: "BAD_REQUEST",
          message:
            "ideaId, title, description, and platform (youtube|tiktok|reels) are required",
        },
        400,
      );
    }

    const userId = c.get("userId");
    const usageStore = c.get("usageStore") as UsageStore;

  try {
      // 2. Lire quota user (table ai_usage)
      // 3. Si count >= limit → 429 LIMIT_REACHED
      await assertCanGenerate(usageStore, userId);

      const mode =
        payload.mode === "improve" && payload.existingScript?.trim()
          ? "improve"
          : "generate";

      // 4. Construire prompt selon platform
      // 5. Appeler LLM
      const { script, model } = await generateScriptWithLlm({
        title: payload.title,
        description: payload.description,
        platform: payload.platform,
        language: payload.language ?? "fr",
        mode,
        existingScript: payload.existingScript,
      });

      // 6. Incrémenter quota
      let usage;
      try {
        usage = await usageStore.incrementUsage(userId);
      } catch (incrementError) {
        if (
          incrementError instanceof Error &&
          incrementError.message === "LIMIT_REACHED"
        ) {
          const snap =
            (incrementError as Error & {
              usage?: { count: number; limit: number; remaining: number };
            }).usage ?? (await usageStore.getUsage(userId));
          return c.json(limitError(snap), 429);
        }
        throw incrementError;
      }

      // 7. Retourner { script, usage, model }
      return c.json({ script, usage, model });
    } catch (error) {
      if (error instanceof Error && error.message === "LIMIT_REACHED") {
        const usage =
          (error as Error & { usage?: { count: number; limit: number; remaining: number } })
            .usage ?? (await usageStore.getUsage(userId));
        return c.json(limitError(usage), 429);
      }

      console.error("generate-script error:", error);
      return c.json(
        {
          error: "PROVIDER_ERROR",
          message:
            error instanceof Error ? error.message : "Script generation failed",
        },
        500,
      );
    }
  });

  return ai;
}
