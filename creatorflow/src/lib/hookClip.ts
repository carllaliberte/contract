import { clampClipDuration } from "./api/generateClip";

const WIDTH = 720;
const HEIGHT = 1280;
const FPS = 30;

const MIME_CANDIDATES = [
  "video/mp4;codecs=avc1.42E01E",
  "video/mp4",
  "video/webm;codecs=vp9",
  "video/webm",
];

export function pickClipMimeType(
  isTypeSupported: (type: string) => boolean = (type) =>
    typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(type),
): string {
  return MIME_CANDIDATES.find((type) => isTypeSupported(type)) ?? "";
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (ctx.measureText(next).width <= maxWidth) current = next;
    else {
      if (current) lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines;
}

function drawFrame(
  ctx: CanvasRenderingContext2D,
  t: number,
  duration: number,
  hook: string,
) {
  const p = Math.min(1, Math.max(0, t / duration));
  const zoom = 1.05 + Math.sin(p * Math.PI) * 0.08;
  const driftX = Math.sin(p * Math.PI * 2) * 18;
  const driftY = Math.cos(p * Math.PI) * 10;

  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = "#070707";
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  ctx.save();
  ctx.translate(WIDTH / 2 + driftX, HEIGHT / 2 + driftY);
  ctx.scale(zoom, zoom);
  ctx.translate(-WIDTH / 2, -HEIGHT / 2);

  const glow = ctx.createRadialGradient(520, 220, 20, 520, 220, 520);
  glow.addColorStop(0, `rgba(255,59,48,${0.18 + 0.16 * Math.sin(p * Math.PI)})`);
  glow.addColorStop(1, "rgba(255,59,48,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  const pulse = 0.45 + 0.55 * (0.5 + 0.5 * Math.sin(t * Math.PI * 3));
  ctx.fillStyle = `rgba(255,59,48,${pulse})`;
  ctx.beginPath();
  ctx.arc(64, 72, 10, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "rgba(255,255,255,0.55)";
  ctx.font = "600 22px Outfit, system-ui, sans-serif";
  ctx.fillText("CLAPSHOT  REC", 88, 80);

  ctx.fillStyle = "#f4efe6";
  ctx.font = "600 54px Outfit, system-ui, sans-serif";
  const lines = wrapText(ctx, hook.trim() || "Clapshot", WIDTH - 96);
  let y = 420;
  for (const line of lines.slice(0, 7)) {
    ctx.fillText(line, 48, y);
    y += 70;
  }

  ctx.fillStyle = "rgba(255,255,255,0.35)";
  ctx.font = "500 22px Outfit, system-ui, sans-serif";
  ctx.fillText("clapshot", 48, HEIGHT - 64);
  ctx.restore();
}

export async function renderHookClip(
  hook: string,
  duration = 6,
  _script = "",
): Promise<File | null> {
  if (typeof document === "undefined" || typeof MediaRecorder === "undefined") {
    return null;
  }
  const seconds = clampClipDuration(duration);
  const canvas = document.createElement("canvas");
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  const ctx = canvas.getContext("2d", { alpha: false });
  if (!ctx) return null;

  drawFrame(ctx, 0, seconds, hook);
  const stream = canvas.captureStream(FPS);
  const mime = pickClipMimeType();
  let recorder: MediaRecorder;
  try {
    recorder = mime
      ? new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 2_500_000 })
      : new MediaRecorder(stream, { videoBitsPerSecond: 2_500_000 });
  } catch {
    try {
      recorder = new MediaRecorder(stream);
    } catch {
      return null;
    }
  }

  const chunks: BlobPart[] = [];
  recorder.ondataavailable = (event) => {
    if (event.data.size > 0) chunks.push(event.data);
  };

  const stopped = new Promise<Blob>((resolve, reject) => {
    recorder.onerror = () => reject(new Error("recorder"));
    recorder.onstop = () => {
      resolve(new Blob(chunks, { type: recorder.mimeType || mime || "video/mp4" }));
    };
  });

  const startedAt = performance.now();
  let frame = 0;
  const tick = () => {
    const elapsed = (performance.now() - startedAt) / 1000;
    drawFrame(ctx, Math.min(elapsed, seconds), seconds, hook);
    frame += 1;
    if (elapsed < seconds && recorder.state === "recording") {
      requestAnimationFrame(tick);
    }
  };

  try {
    recorder.start(200);
    requestAnimationFrame(tick);
    await new Promise((resolve) => window.setTimeout(resolve, seconds * 1000));
    if (recorder.state === "recording") recorder.stop();
    stream.getTracks().forEach((track) => track.stop());
    const blob = await stopped;
    if (!blob.size) return null;
    const type = blob.type.startsWith("video/") ? blob.type : "video/mp4";
    const ext = type.includes("webm") ? "webm" : "mp4";
    return new File([blob], `clapshot.${ext}`, { type });
  } catch {
    if (recorder.state === "recording") recorder.stop();
    stream.getTracks().forEach((track) => track.stop());
    return null;
  } finally {
    void frame;
  }
}
