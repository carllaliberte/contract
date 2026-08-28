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

function clampDuration(raw: unknown): number {
  const n = typeof raw === "number" ? raw : Number(raw);
  if (!Number.isFinite(n)) return 6;
  return Math.min(15, Math.max(6, Math.round(n)));
}

async function pollVideo(apiKey: string, requestId: string): Promise<string> {
  const deadline = Date.now() + 90_000;
  while (Date.now() < deadline) {
    const res = await fetch(`https://api.x.ai/v1/videos/${requestId}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    const data = await res.json();
    const url =
      data?.video?.url ?? data?.url ?? data?.data?.[0]?.url ?? null;
    if (typeof url === "string" && url) return url;
    if (data?.status === "failed" || data?.error) {
      throw new Error(
        typeof data?.error === "string" ? data.error : data?.error?.message ?? "clip failed",
      );
    }
    await new Promise((resolve) => setTimeout(resolve, 2500));
  }
  throw new Error("clip timeout");
}

function bytesToB64(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return btoa(binary);
}

async function attachClipBytes(
  url: string,
  duration: number,
  hook: string,
): Promise<Record<string, unknown>> {
  const body: Record<string, unknown> = { url, duration, hook };
  try {
    const res = await fetch(url);
    if (!res.ok) return body;
    const bytes = new Uint8Array(await res.arrayBuffer());
    if (bytes.byteLength === 0 || bytes.byteLength > 4_500_000) return body;
    body.b64 = bytesToB64(bytes);
    body.mime = res.headers.get("content-type")?.split(";")[0] || "video/mp4";
  } catch {
    // URL still returned; client may fetch it.
  }
  return body;
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

  let body: {
    hook?: string;
    duration?: number;
    script?: string;
    imageUrl?: string;
    imageB64?: string;
  };
  try {
    body = await req.json();
  } catch {
    return json({ error: "BAD_REQUEST", message: "Invalid JSON" }, 400);
  }

  const hook = (body.hook ?? "").trim();
  const script = (body.script ?? "").trim();
  const duration = clampDuration(body.duration);
  const imageUrl = body.imageUrl?.trim();
  const imageB64 = body.imageB64?.trim();
  if (!hook && !script && !imageUrl && !imageB64) {
    return json({ error: "BAD_REQUEST", message: "hook or image required" }, 400);
  }

  const scene = hook || "A creator hits publish on X";
  const action = script
    ? `Picture this action, no readable text: ${script.slice(0, 500)}`
    : `Show this idea in motion: ${scene}`;
  const tail = Math.max(1, duration - 1);
  const prompt = [
    `Photoreal cinematic VIDEO, vertical 9:16, ${duration} seconds, 24fps, shallow depth of field.`,
    `The camera is NEVER locked off. This is not a still, not a poster, not Ken Burns.`,
    `0.0-1.2s: crash-in (dolly forward + micro handheld) onto the first action. Movement already started on frame 1.`,
    `1.2-${tail.toFixed(1)}s: orbit right about 20 degrees, parallax in the background, one clear gesture.`,
    `Last 1.0s: ease-out pull-back to a medium shot, settle only on the final frames.`,
    `Forbidden: freeze-frame, slideshow, zooming a graphic, on-screen text, logos, captions, watermarks, UI type.`,
    action,
    `Subject: ${scene}.`,
  ].join(" ");

  const payload: Record<string, unknown> = {
    model: Deno.env.get("XAI_VIDEO_MODEL") ?? "grok-imagine-video-1.5",
    prompt,
    duration,
    aspect_ratio: "9:16",
    resolution: "720p",
  };
  if (imageB64) {
    payload.image = { url: `data:image/png;base64,${imageB64}` };
  } else if (imageUrl) {
    payload.image = { url: imageUrl };
  }

  const started = await fetch("https://api.x.ai/v1/videos/generations", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  const startData = await started.json();
  if (!started.ok) {
    return json(
      {
        error: "PROVIDER_ERROR",
        message:
          typeof startData?.error?.message === "string"
            ? startData.error.message
            : "Imagine video failed",
      },
      500,
    );
  }

  const direct =
    startData?.video?.url ?? startData?.url ?? startData?.data?.[0]?.url;
  if (typeof direct === "string" && direct) {
    return json(await attachClipBytes(direct, duration, hook));
  }

  const requestId = startData?.request_id ?? startData?.id;
  if (!requestId) {
    return json({ error: "PROVIDER_ERROR", message: "No request_id" }, 500);
  }

  try {
    const url = await pollVideo(apiKey, String(requestId));
    return json(await attachClipBytes(url, duration, hook));
  } catch (error) {
    return json(
      {
        error: "PROVIDER_ERROR",
        message: error instanceof Error ? error.message : "clip failed",
      },
      500,
    );
  }
});
