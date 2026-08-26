import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type AppleAuthBody = {
  identityToken?: string;
  authorizationCode?: string;
  user?: string | null;
  email?: string | null;
  givenName?: string | null;
  familyName?: string | null;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "BAD_REQUEST", message: "POST only" }),
      {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }

  let body: AppleAuthBody;
  try {
    body = (await req.json()) as AppleAuthBody;
  } catch {
    return new Response(
      JSON.stringify({ error: "BAD_REQUEST", message: "Invalid JSON body" }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }

  const identityToken = body.identityToken?.trim() ?? "";
  if (!identityToken) {
    return new Response(
      JSON.stringify({ error: "BAD_REQUEST", message: "identityToken is required" }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !supabaseAnonKey) {
    return new Response(
      JSON.stringify({ error: "PROVIDER_ERROR", message: "Supabase is not configured" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data, error } = await supabase.auth.signInWithIdToken({
    provider: "apple",
    token: identityToken,
  });

  if (error || !data.session) {
    return new Response(
      JSON.stringify({
        error: "UNAUTHORIZED",
        message: error?.message ?? "Apple sign-in failed",
      }),
      {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }

  const displayName = [body.givenName, body.familyName]
    .filter((part) => typeof part === "string" && part.trim())
    .join(" ")
    .trim();

  if (serviceRoleKey && data.user) {
    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { error: profileError } = await admin.from("profiles").upsert(
      {
        id: data.user.id,
        ...(displayName ? { display_name: displayName } : {}),
      },
      { onConflict: "id" },
    );
    if (profileError) {
      console.warn("profiles upsert failed:", profileError.message);
    }
  }

  return new Response(
    JSON.stringify({
      accessToken: data.session.access_token,
      token: data.session.access_token,
      userId: data.user?.id ?? body.user ?? null,
    }),
    {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    },
  );
});
