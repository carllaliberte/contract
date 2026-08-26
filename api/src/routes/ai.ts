import { Hono } from "hono";
import type { AuthVariables } from "../middleware/auth.js";
import { authMiddleware, getSupabaseAdminClient } from "../middleware/auth.js";
import { env } from "../env.js";
import { logAiGeneration } from "../services/aiGenerations.js";
import {
  assertCanGenerate,
  validateDurationForPlan,
  type UsageStore,
} from "../services/aiUsage.js";
import { generateScriptWithLlm } from "../services/llm.js";
import {
  isGenerateMode,
  isLanguage,
  isLongDuration,
  isPlatform,
  isScriptFormat,
  type GenerateScriptErrorBody,
  type GenerateScriptRequest,
  type ScriptFormat,
} from "../types.js";

type AppEnv = { Variables: AuthVariables };

function parseBody(raw: unknown): GenerateScriptRequest | null {
  if (!raw || typeof raw !== "object") return null;
  const b = raw as Record<string, unknown>;
  if (typeof b.ideaId !== "string" || !b.ideaId.trim()) return null;
  if (typeof b.title !== "string" || !b.title.trim()) return null;
  if (typeof b.description !== "string") return null;
  if (typeof b.platform !== "string" || !isPlatform(b.platform)) return null;

  const format =
    typeof b.format === "string" && isScriptFormat(b.format) ? b.format : "short";
  const durationMinutes =
    typeof b.durationMinutes === "number" && isLongDuration(b.durationMinutes)
      ? b.durationMinutes
      : undefined;

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
    format,
    durationMinutes,
  };
}

function limitError(
  usage: NonNullable<GenerateScriptErrorBody["usage"]>,
  format: ScriptFormat,
): GenerateScriptErrorBody {
  const quota = format === "long" ? usage.long : usage.short;
  return {
    error: "LIMIT_REACHED",
    message: `Monthly ${format} script limit reached (${quota.count}/${quota.limit})`,
    usage,
  };
}

export function createAiRoutes() {
  const ai = new Hono<AppEnv>();

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

    const format: ScriptFormat = payload.format ?? "short";
    const userId = c.get("userId");
    const usageStore = c.get("usageStore") as UsageStore;

    try {
      const usage = await usageStore.getUsage(userId);
      const durationError = validateDurationForPlan(
        usage.plan,
        format,
        payload.durationMinutes,
      );
      if (durationError) {
        return c.json({ error: "BAD_REQUEST", message: durationError }, 400);
      }

      await assertCanGenerate(usageStore, userId, format);

      const mode =
        payload.mode === "improve" && payload.existingScript?.trim()
          ? "improve"
          : "generate";

      const { script, model } = await generateScriptWithLlm({
        title: payload.title,
        description: payload.description,
        platform: payload.platform,
        language: payload.language ?? "fr",
        mode,
        existingScript: payload.existingScript,
        format,
        durationMinutes: payload.durationMinutes,
      });

      let finalUsage;
      try {
        finalUsage = await usageStore.incrementUsage(userId, format);
      } catch (incrementError) {
        if (
          incrementError instanceof Error &&
          incrementError.message === "LIMIT_REACHED"
        ) {
          const snap =
            (incrementError as Error & {
              usage?: NonNullable<GenerateScriptErrorBody["usage"]>;
            }).usage ?? (await usageStore.getUsage(userId));
          return c.json(limitError(snap, format), 429);
        }
        throw incrementError;
      }

      const admin = getSupabaseAdminClient();
      if (admin) {
        await logAiGeneration(admin, {
          userId,
          ideaId: payload.ideaId,
          platform: payload.platform,
        });
      }

      return c.json({ script, usage: finalUsage, model });
    } catch (error) {
      if (error instanceof Error && error.message === "LIMIT_REACHED") {
        const usage =
          (error as Error & {
            usage?: NonNullable<GenerateScriptErrorBody["usage"]>;
          }).usage ?? (await usageStore.getUsage(userId));
        return c.json(limitError(usage, format), 429);
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
