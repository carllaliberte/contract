/** Dev-only Imagine proxy. Never ships in the Pages bundle. */

const XAI = "https://api.x.ai/v1";

function send(res, status, body) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.end(JSON.stringify(body));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => {
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}"));
      } catch {
        resolve({});
      }
    });
    req.on("error", reject);
  });
}

async function pollVideo(apiKey, requestId) {
  const deadline = Date.now() + 90_000;
  while (Date.now() < deadline) {
    const res = await fetch(`${XAI}/videos/${requestId}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    const data = await res.json();
    const url = data?.video?.url ?? data?.url ?? data?.data?.[0]?.url;
    if (typeof url === "string" && url) return url;
    if (data?.status === "failed" || data?.error) {
      throw new Error(
        typeof data?.error === "string"
          ? data.error
          : data?.error?.message ?? "clip failed",
      );
    }
    await new Promise((r) => setTimeout(r, 2500));
  }
  throw new Error("clip timeout");
}

function buildPrompt(hook, script, duration) {
  const scene = hook || "A creator hits publish on X";
  const action = script
    ? `Picture this action, no readable text: ${String(script).slice(0, 500)}`
    : `Show this idea in motion: ${scene}`;
  const tail = Math.max(1, duration - 1);
  return [
    `Photoreal cinematic VIDEO, vertical 9:16, ${duration} seconds, 24fps, shallow depth of field.`,
    `The camera is NEVER locked off. This is not a still, not a poster, not Ken Burns.`,
    `0.0-1.2s: crash-in (dolly forward + micro handheld) onto the first action. Movement already started on frame 1.`,
    `1.2-${tail.toFixed(1)}s: orbit right about 20 degrees, parallax in the background, one clear gesture.`,
    `Last 1.0s: ease-out pull-back to a medium shot, settle only on the final frames.`,
    `Forbidden: freeze-frame, slideshow, zooming a graphic, on-screen text, logos, captions, watermarks, UI type.`,
    action,
    `Subject: ${scene}.`,
  ].join(" ");
}

async function generateClip(body) {
  const apiKey = process.env.XAI_API_KEY;
  if (!apiKey) {
    const err = new Error("XAI_API_KEY is not configured");
    err.code = "GROK_NOT_CONFIGURED";
    throw err;
  }
  const hook = String(body?.hook ?? "").trim();
  const script = String(body?.script ?? "").trim();
  let duration = Number(body?.duration);
  if (!Number.isFinite(duration)) duration = 6;
  duration = Math.min(15, Math.max(6, Math.round(duration)));
  if (!hook && !script) {
    const err = new Error("hook or image required");
    err.code = "BAD_REQUEST";
    throw err;
  }
  const started = await fetch(`${XAI}/videos/generations`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.XAI_VIDEO_MODEL ?? "grok-imagine-video-1.5",
      prompt: buildPrompt(hook, script, duration),
      duration,
      aspect_ratio: "9:16",
      resolution: "720p",
    }),
  });
  const startData = await started.json();
  if (!started.ok) {
    const err = new Error(
      typeof startData?.error?.message === "string"
        ? startData.error.message
        : "Imagine video failed",
    );
    err.code = "PROVIDER_ERROR";
    throw err;
  }
  const direct = startData?.video?.url ?? startData?.url ?? startData?.data?.[0]?.url;
  if (typeof direct === "string" && direct) return { url: direct, duration, hook };
  const requestId = startData?.request_id ?? startData?.id;
  if (!requestId) {
    const err = new Error("No request_id");
    err.code = "PROVIDER_ERROR";
    throw err;
  }
  const url = await pollVideo(apiKey, String(requestId));
  return { url, duration, hook };
}

export function isClipProxyPath(url = "") {
  const path = url.split("?")[0];
  return (
    path.endsWith("/ai/generate-clip") ||
    path.endsWith("/generate-clip") ||
    path === "/ai/generate-clip"
  );
}

export async function handleClipProxy(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "authorization, x-client-info, apikey, content-type, x-demo-id",
  );
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    res.end();
    return;
  }
  if (req.method !== "POST") {
    send(res, 405, { error: "BAD_REQUEST", message: "POST only" });
    return;
  }
  try {
    const body = await readBody(req);
    const clip = await generateClip(body);
    send(res, 200, clip);
  } catch (error) {
    const code = error?.code === "BAD_REQUEST" ? 400 : 500;
    send(res, code, {
      error: error?.code ?? "PROVIDER_ERROR",
      message: error instanceof Error ? error.message : "clip failed",
    });
  }
}
