import { createClient, type SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.49.8";
import { buildScriptPrompt } from "../_shared/prompt.ts";
import { LIMITS, limitForPlan } from "../_shared/limits.ts";
import {
  isGenerateMode,
  isLanguage,
  isPlatform,
  type AiUsageSnapshot,
  type GenerateScriptErrorBody,
  type GenerateScriptRequest,
  type GenerateScriptResponse,
} from "../_shared/types.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-demo-id",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(
  body: GenerateScriptResponse | GenerateScriptErrorBody,
  status = 200,
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function currentMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function snapshot(count: number, limit: number): AiUsageSnapshot {
  return { count, limit, remaining: Math.max(0, limit - count) };
}

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
      .select("count")
      .eq("demo_id", userId)
      .eq("month", month)
      .maybeSingle();
    if (error) throw new Error(error.message);
    const count = data?.count ?? 0;
    return snapshot(count, LIMITS.free);
  }

  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .select("plan")
    .eq("id", userId)
    .maybeSingle();
  if (profileError) throw new Error(profileError.message);

  const limit = limitForPlan(profile?.plan ?? "free");

  const { data, error } = await admin
    .from("ai_usage")
    .select("count")
    .eq("user_id", userId)
    .eq("month", month)
    .maybeSingle();
  if (error) throw new Error(error.message);

  return snapshot(data?.count ?? 0, limit);
}

async function incrementUsage(
  admin: SupabaseClient,
  userId: string,
  isDemo: boolean,
): Promise<AiUsageSnapshot> {
  const month = currentMonth();

  if (isDemo) {
    const { data, error } = await admin.rpc("increment_demo_ai_usage", {
      p_demo_id: userId,
      p_month: month,
    });
    if (error) {
      if (error.message.includes("LIMIT_REACHED")) {
        const usage = await getUsage(admin, userId, true);
        const err = new Error("LIMIT_REACHED") as Error & { usage?: AiUsageSnapshot };
        err.usage = usage;
        throw err;
      }
      throw new Error(error.message);
    }
    const row = data?.[0] as { count: number; limit: number } | undefined;
    if (!row) throw new Error("increment_demo_ai_usage returned no row");
    return snapshot(row.count, row.limit);
  }

  const { data, error } = await admin.rpc("increment_ai_usage", {
    p_user_id: userId,
    p_month: month,
  });
  if (error) {
    if (error.message.includes("LIMIT_REACHED")) {
      const usage = await getUsage(admin, userId, false);
      const err = new Error("LIMIT_REACHED") as Error & { usage?: AiUsageSnapshot };
      err.usage = usage;
      throw err;
    }
    throw new Error(error.message);
  }
  const row = data?.[0] as { count: number; limit: number } | undefined;
  if (!row) throw new Error("increment_ai_usage returned no row");
  return snapshot(row.count, row.limit);
}

async function callOpenAi(
  system: string,
  user: string,
): Promise<{ script: string; model: string }> {
  const apiKey = Deno.env.get("OPENAI_API_KEY");
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured");
  }

  const model = Deno.env.get("OPENAI_MODEL") ?? "gpt-4o-mini";
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
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
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    const msg =
      typeof data?.error?.message === "string"
        ? data.error.message
        : "OpenAI request failed";
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
): Promise<void> {
  if (isDemo) return;
  const { error } = await admin.from("ai_generations").insert({
    user_id: userId,
    idea_id: ideaId,
    platform,
  });
  if (error) console.warn("ai_generations insert failed:", error.message);
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
          "ideaId, title, description, and platform (youtube|tiktok|reels) are required",
      },
      400,
    );
  }

  const authResult = await resolveAuth(req, anonClient);
  if ("error" in authResult) {
    return json(authResult, 401);
  }

  const { userId, isDemo } = authResult;

  try {
    const usage = await getUsage(admin, userId, isDemo);
    if (usage.count >= usage.limit) {
      return json(
        {
          error: "LIMIT_REACHED",
          message: "Monthly AI generation limit reached",
          usage,
        },
        429,
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
    });

    const { script, model } = await callOpenAi(system, user);

    let finalUsage: AiUsageSnapshot;
    try {
      finalUsage = await incrementUsage(admin, userId, isDemo);
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
        );
      }
      throw incrementError;
    }

    await logGeneration(admin, userId, payload.ideaId, payload.platform, isDemo);

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
