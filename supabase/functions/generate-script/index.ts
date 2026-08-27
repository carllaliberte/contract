import { createClient, type SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.49.8";
import { buildScriptPrompt } from "../_shared/prompt.ts";
import {
  limitForFormat,
  maxLongMinutesForPlan,
  type PlanId,
  type ScriptFormat,
} from "../_shared/limits.ts";
import {
  isGenerateMode,
  isLanguage,
  isLongDuration,
  isPlatform,
  isScriptFormat,
  type AiUsageSnapshot,
  type FormatQuota,
  type GenerateMode,
  type Language,
  type GenerateScriptErrorBody,
  type GenerateScriptRequest,
  type GenerateScriptResponse,
  type Platform,
} from "../_shared/types.ts";
import { checkAiRateLimit } from "../_shared/rateLimit.ts";
import {
  hashPromptTitle,
  recordGenerationProvenance,
} from "../_shared/provenance.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-demo-id",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(
  body: GenerateScriptResponse | GenerateScriptErrorBody,
  status = 200,
  extraHeaders: Record<string, string> = {},
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json", ...extraHeaders },
  });
}

function currentMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function formatQuota(count: number, plan: PlanId, format: ScriptFormat): FormatQuota {
  const limit = limitForFormat(plan, format);
  return { count, limit, remaining: Math.max(0, limit - count) };
}

function parseUsageRow(row: {
  short_count?: number;
  long_count?: number;
  short_limit?: number;
  long_limit?: number;
  short_remaining?: number;
  long_remaining?: number;
  plan?: string;
}): AiUsageSnapshot {
  const plan: PlanId = row.plan === "pro" ? "pro" : "free";
  return {
    plan,
    short: {
      count: row.short_count ?? 0,
      limit: row.short_limit ?? limitForFormat(plan, "short"),
      remaining: row.short_remaining ?? 0,
    },
    long: {
      count: row.long_count ?? 0,
      limit: row.long_limit ?? limitForFormat(plan, "long"),
      remaining: row.long_remaining ?? 0,
    },
  };
}

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
  };
}

async function resolveAuth(
  req: Request,
  anonClient: SupabaseClient,
): Promise<{ userId: string; isDemo: boolean } | GenerateScriptErrorBody> {
  const authHeader = req.headers.get("Authorization");
  const demoId = req.headers.get("x-demo-id");

  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7).trim();
    if (!token) {
      return { error: "UNAUTHORIZED", message: "Missing bearer token" };
    }
    const { data, error } = await anonClient.auth.getUser(token);
    if (error || !data.user) {
      return { error: "UNAUTHORIZED", message: "Invalid or expired token" };
    }
    return { userId: data.user.id, isDemo: false };
  }

  if (demoId) {
    return { userId: demoId, isDemo: true };
  }

  return {
    error: "UNAUTHORIZED",
    message: "Provide Authorization Bearer token or x-demo-id header",
  };
}

async function getUsage(
  admin: SupabaseClient,
  userId: string,
  isDemo: boolean,
): Promise<AiUsageSnapshot> {
  const month = currentMonth();

  if (isDemo) {
    const { data, error } = await admin
      .from("demo_ai_usage")
      .select("short_count, long_count")
      .eq("demo_id", userId)
      .eq("month", month)
      .maybeSingle();
    if (error) throw new Error(error.message);
    const plan: PlanId = "free";
    return {
      plan,
      short: formatQuota(data?.short_count ?? 0, plan, "short"),
      long: formatQuota(data?.long_count ?? 0, plan, "long"),
    };
  }

  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .select("plan")
    .eq("id", userId)
    .maybeSingle();
  if (profileError) throw new Error(profileError.message);

  const plan: PlanId = profile?.plan === "pro" ? "pro" : "free";

  const { data, error } = await admin
    .from("ai_usage")
    .select("short_count, long_count")
    .eq("user_id", userId)
    .eq("month", month)
    .maybeSingle();
  if (error) throw new Error(error.message);

  return {
    plan,
    short: formatQuota(data?.short_count ?? 0, plan, "short"),
    long: formatQuota(data?.long_count ?? 0, plan, "long"),
  };
}

async function incrementUsage(
  admin: SupabaseClient,
  userId: string,
  isDemo: boolean,
  format: ScriptFormat,
): Promise<AiUsageSnapshot> {
  const month = currentMonth();
  const rpc = isDemo ? "increment_demo_ai_usage" : "increment_ai_usage";
  const params = isDemo
    ? { p_demo_id: userId, p_month: month, p_format: format }
    : { p_user_id: userId, p_month: month, p_format: format };

  const { data, error } = await admin.rpc(rpc, params);
  if (error) {
    if (error.message.includes("LIMIT_REACHED")) {
      const usage = await getUsage(admin, userId, isDemo);
      const err = new Error("LIMIT_REACHED") as Error & { usage?: AiUsageSnapshot };
      err.usage = usage;
      throw err;
    }
    throw new Error(error.message);
  }
  const row = data?.[0];
  if (!row) throw new Error(`${rpc} returned no row`);
  return parseUsageRow(row);
}

function validateDurationForPlan(
  plan: PlanId,
  format: ScriptFormat,
  durationMinutes?: number,
): string | null {
  if (format !== "long") return null;
  if (!durationMinutes) return "durationMinutes is required for long format";
  const max = maxLongMinutesForPlan(plan);
  if (durationMinutes > max) {
    return `Long scripts are limited to ${max} minutes on the ${plan} plan`;
  }
  return null;
}

async function callGrok(
  system: string,
  user: string,
): Promise<{ script: string; model: string }> {
  const apiKey = Deno.env.get("XAI_API_KEY");
  if (!apiKey) {
    throw new Error("XAI_API_KEY is not configured");
  }

  const model = Deno.env.get("XAI_MODEL") ?? "grok-4.5";
  const res = await fetch("https://api.x.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      temperature: 0.7,
      max_tokens: 1800,
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    const msg =
      typeof data?.error?.message === "string"
        ? data.error.message
        : "Grok request failed";
    throw new Error(msg);
  }

  const script = data?.choices?.[0]?.message?.content?.trim();
  if (!script) throw new Error("Empty LLM response");

  return { script, model: data?.model ?? model };
}

async function logGeneration(
  admin: SupabaseClient,
  userId: string,
  ideaId: string,
  platform: string,
  isDemo: boolean,
  details: {
    format: ScriptFormat;
    mode: GenerateMode;
    language: Language;
    plan: PlanId;
    model: string;
    title: string;
  },
): Promise<void> {
  await recordGenerationProvenance(
    admin,
    {
      userId,
      ideaId,
      platform: platform as Platform,
      format: details.format,
      mode: details.mode,
      language: details.language,
      plan: details.plan,
      model: details.model,
      titleHash: await hashPromptTitle(details.title),
    },
    isDemo,
  );
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return json({ error: "BAD_REQUEST", message: "POST only" }, 405);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !supabaseAnonKey || !serviceRoleKey) {
    return json(
      { error: "PROVIDER_ERROR", message: "Supabase is not configured" },
      500,
    );
  }

  const anonClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return json({ error: "BAD_REQUEST", message: "Invalid JSON body" }, 400);
  }

  const payload = parseBody(body);
  if (!payload) {
    return json(
      {
        error: "BAD_REQUEST",
        message:
          "ideaId, title, description, and platform (youtube|tiktok|reels|instagram|x) are required",
      },
      400,
    );
  }

  const authResult = await resolveAuth(req, anonClient);
  if ("error" in authResult) {
    return json(authResult, 401);
  }

  const { userId, isDemo } = authResult;
  const format: ScriptFormat = payload.format ?? "short";

  try {
    const usage = await getUsage(admin, userId, isDemo);
    const durationError = validateDurationForPlan(
      usage.plan,
      format,
      payload.durationMinutes,
    );
    if (durationError) {
      return json({ error: "BAD_REQUEST", message: durationError }, 400);
    }

    const quota = format === "long" ? usage.long : usage.short;
    if (quota.count >= quota.limit) {
      return json(
        {
          error: "LIMIT_REACHED",
          message: `Monthly ${format} script limit reached`,
          usage,
        },
        429,
        { "Retry-After": "86400" },
      );
    }

    const burst = checkAiRateLimit(userId);
    if (!burst.allowed) {
      return json(
        {
          error: "RATE_LIMITED",
          message: `Too many AI requests — retry in ${burst.retryAfterSeconds}s`,
          usage,
        },
        429,
        { "Retry-After": String(burst.retryAfterSeconds) },
      );
    }

    const mode =
      payload.mode === "improve" && payload.existingScript?.trim()
        ? "improve"
        : "generate";

    const { system, user } = buildScriptPrompt({
      title: payload.title,
      description: payload.description,
      platform: payload.platform,
      language: payload.language ?? "fr",
      mode,
      existingScript: payload.existingScript,
      format,
      durationMinutes: payload.durationMinutes,
      styleContext: payload.styleContext,
    });

    const { script, model } = await callGrok(system, user);

    let finalUsage: AiUsageSnapshot;
    try {
      finalUsage = await incrementUsage(admin, userId, isDemo, format);
    } catch (incrementError) {
      if (
        incrementError instanceof Error &&
        incrementError.message === "LIMIT_REACHED"
      ) {
        const snap =
          (incrementError as Error & { usage?: AiUsageSnapshot }).usage ??
          (await getUsage(admin, userId, isDemo));
        return json(
          {
            error: "LIMIT_REACHED",
            message: "Monthly AI generation limit reached",
            usage: snap,
          },
          429,
          { "Retry-After": "86400" },
        );
      }
      throw incrementError;
    }

    await logGeneration(admin, userId, payload.ideaId, payload.platform, isDemo, {
      format,
      mode,
      language: payload.language ?? "fr",
      plan: finalUsage.plan,
      model,
      title: payload.title,
    });

    return json({ script, usage: finalUsage, model });
  } catch (error) {
    console.error("generate-script error:", error);
    return json(
      {
        error: "PROVIDER_ERROR",
        message: error instanceof Error ? error.message : "Script generation failed",
      },
      500,
    );
  }
});
