const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-demo-id",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return json({ error: "BAD_REQUEST", message: "POST only" }, 405);
  }

  const apiKey = Deno.env.get("XAI_API_KEY");
  if (!apiKey) {
    return json({ error: "GROK_NOT_CONFIGURED", message: "XAI_API_KEY is not configured" }, 500);
  }

  let body: { hook?: string; title?: string; language?: string };
  try {
    body = await req.json();
  } catch {
    return json({ error: "BAD_REQUEST", message: "Invalid JSON" }, 400);
  }

  const hook = (body.hook || body.title || "").trim();
  if (!hook) {
    return json({ error: "BAD_REQUEST", message: "hook required" }, 400);
  }

  const prompt =
    `Cinematic vertical social post for Clapshot. Dark black background, subtle red spotlight. ` +
    `Small word CLAPSHOT top left with a red recording dot. ` +
    `Large elegant off-white headline exactly: "${hook}". ` +
    `Photoreal still life that illustrates the line. No extra logos, no watermark, no other text.`;

  const res = await fetch("https://api.x.ai/v1/images/generations", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: Deno.env.get("XAI_IMAGE_MODEL") ?? "grok-imagine-image-2.0",
      prompt,
      aspect_ratio: "2:3",
      n: 1,
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    return json(
      {
        error: "PROVIDER_ERROR",
        message: typeof data?.error?.message === "string" ? data.error.message : "Imagine failed",
      },
      500,
    );
  }

  const url = data?.data?.[0]?.url as string | undefined;
  const b64 = data?.data?.[0]?.b64_json as string | undefined;
  if (!url && !b64) {
    return json({ error: "PROVIDER_ERROR", message: "Empty image" }, 500);
  }

  return json({ url, b64, hook });
});
