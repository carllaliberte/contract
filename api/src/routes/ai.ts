import { Hono } from "hono";
import type { AuthVariables } from "../middleware/auth.js";
import { authMiddleware, getSupabaseAdminClient } from "../middleware/auth.js";
import { env } from "../env.js";
import {
  assertCanGenerate,
  validateDurationForPlan,
  type UsageStore,
} from "../services/aiUsage.js";
import { generateScriptWithLlm } from "../services/llm.js";
import { resolveOpenSource } from "../services/openSource.js";
import { grokNotConfiguredCode } from "../services/scriptPack.js";
import { generateTtsAudio } from "../services/tts.js";
import {
  hashPromptTitle,
  recordGenerationProvenance,
} from "../services/provenanceService.js";
import { checkAiRateLimit } from "../services/rateLimit.js";
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
    styleContext:
      typeof b.styleContext === "string" && b.styleContext.trim()
        ? b.styleContext.trim()
        : undefined,
    sourceUrl:
      typeof b.sourceUrl === "string" && b.sourceUrl.trim()
        ? b.sourceUrl.trim()
        : undefined,
    sourceText:
      typeof b.sourceText === "string" && b.sourceText.trim()
        ? b.sourceText.trim()
        : undefined,
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

function rateLimitError(retryAfterSeconds: number): GenerateScriptErrorBody {
  return {
    error: "RATE_LIMITED",
    message: `Too many AI requests — retry in ${retryAfterSeconds}s`,
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
            "ideaId, title, description, and platform (youtube|tiktok|reels|instagram|x) are required",
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

      const burst = checkAiRateLimit(userId);
      if (!burst.allowed) {
        c.header("Retry-After", String(burst.retryAfterSeconds));
        return c.json(rateLimitError(burst.retryAfterSeconds), 429);
      }

      await assertCanGenerate(usageStore, userId, format);

      const mode =
        payload.mode === "improve" && payload.existingScript?.trim()
          ? "improve"
          : "generate";

      const source = await resolveOpenSource({
        url: payload.sourceUrl,
        text: payload.sourceText,
      });
      if ("error" in source) {
        return c.json({ error: "BAD_REQUEST", message: source.error }, 400);
      }

      const { script, titles, description, hashtags, hooks, model } =
        await generateScriptWithLlm({
        title: payload.title,
        description: payload.description,
        platform: payload.platform,
        language: payload.language ?? "fr",
        mode,
        existingScript: payload.existingScript,
        format,
        durationMinutes: payload.durationMinutes,
        styleContext: payload.styleContext,
        sourceContext: source.context,
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
          c.header("Retry-After", "86400");
          return c.json(limitError(snap, format), 429);
        }
        throw incrementError;
      }

      const admin = getSupabaseAdminClient();
      if (admin) {
        await recordGenerationProvenance(admin, {
          userId,
          ideaId: payload.ideaId,
          platform: payload.platform,
          format,
          mode,
          language: payload.language ?? "fr",
          plan: finalUsage.plan,
          model,
          titleHash: hashPromptTitle(payload.title),
        });
      }

      return c.json({
        script,
        titles,
        description,
        hashtags,
        hooks,
        usage: finalUsage,
        model,
      });
    } catch (error) {
      if (error instanceof Error && error.message === "LIMIT_REACHED") {
        const usage =
          (error as Error & {
            usage?: NonNullable<GenerateScriptErrorBody["usage"]>;
          }).usage ?? (await usageStore.getUsage(userId));
        c.header("Retry-After", "86400");
        return c.json(limitError(usage, format), 429);
      }

      console.error("generate-script error:", error);
      const raw =
        error instanceof Error ? error.message : "Script generation failed";
      return c.json(
        {
          error: "PROVIDER_ERROR",
          message: grokNotConfiguredCode(raw),
        },
        500,
      );
    }
  });

  ai.post("/tts", async (c) => {
    let body: unknown;
    try {
      body = await c.req.json();
    } catch {
      return c.json({ error: "BAD_REQUEST", message: "Invalid JSON body" }, 400);
    }

    if (!body || typeof body !== "object") {
      return c.json({ error: "BAD_REQUEST", message: "Invalid JSON body" }, 400);
    }

    const raw = body as Record<string, unknown>;
    const text = typeof raw.text === "string" ? raw.text.trim() : "";
    const voiceId = typeof raw.voiceId === "string" ? raw.voiceId.trim() : "";
    const speed =
      typeof raw.speed === "number" && Number.isFinite(raw.speed) ? raw.speed : 1;

    if (!text) {
      return c.json({ error: "BAD_REQUEST", message: "text is required" }, 400);
    }
    if (!voiceId) {
      return c.json({ error: "BAD_REQUEST", message: "voiceId is required" }, 400);
    }
    if (speed < 0.5 || speed > 2) {
      return c.json(
        { error: "BAD_REQUEST", message: "speed must be between 0.5 and 2" },
        400,
      );
    }

    try {
      const audio = await generateTtsAudio({ text, voiceId, speed });
      return new Response(audio, {
        headers: {
          "Content-Type": "audio/mpeg",
          "Cache-Control": "private, max-age=3600",
        },
      });
    } catch (error) {
      console.error("tts error:", error);
      return c.json(
        {
          error: "PROVIDER_ERROR",
          message: error instanceof Error ? error.message : "TTS generation failed",
        },
        500,
      );
    }
  });

  return ai;
}
