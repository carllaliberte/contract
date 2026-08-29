const WIDTH = 720;
const HEIGHT = 1280;
const FPS = 24;
const VIDEO_BITRATE = 1_000_000;
const KEYFRAME_MS = 1_000;

const MIME_CANDIDATES = [
  "video/mp4;codecs=avc1.42E01E",
  "video/mp4;codecs=avc1",
  "video/mp4",
  "video/webm;codecs=vp9",
  "video/webm",
];

const SKIP_BEAT =
  /photoreal|cinematic video|forbidden:|ken burns|24fps|9:16|aspect ratio|sound world|the camera is never|not a still|not a poster|shallow depth|vertical 9|subject:\s*$/i;

export const CLIP_ENCODER = {
  width: WIDTH,
  height: HEIGHT,
  fps: FPS,
  videoBitsPerSecond: VIDEO_BITRATE,
  keyframeMs: KEYFRAME_MS,
} as const;

export type ClipLook = {
  bg: string;
  accent: [number, number, number];
  ink: string;
  label: string;
  zoomFrom: number;
  zoomTo: number;
  orbit: number;
};

export function pickClipMimeType(
  isTypeSupported: (type: string) => boolean = (type) =>
    typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(type),
): string {
  return MIME_CANDIDATES.find((type) => isTypeSupported(type)) ?? "";
}

export function clipRecorderOptions(mime: string): MediaRecorderOptions[] {
  const rates = {
    videoBitsPerSecond: VIDEO_BITRATE,
    bitsPerSecond: VIDEO_BITRATE,
  };
  const attempts: MediaRecorderOptions[] = [];
  if (mime) attempts.push({ mimeType: mime, ...rates });
  attempts.push(rates);
  if (mime) attempts.push({ mimeType: mime, videoBitsPerSecond: VIDEO_BITRATE });
  if (mime) attempts.push({ mimeType: mime });
  attempts.push({});
  return attempts;
}

function hashText(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function cleanBeat(line: string): string {
  return line
    .replace(/^\d+(\.\d+)?\s*[–\-—]\s*\d+(\.\d+)?s?:\s*/i, "")
    .replace(/^subject:\s*/i, "")
    .replace(/^picture this action, no readable text:\s*/i, "")
    .trim();
}

export function extractClipBeats(hook: string, script = ""): string[] {
  const raw = `${hook}\n${script}`;
  const lines = raw
    .split(/\n+/)
    .map((line) => cleanBeat(line))
    .filter((line) => line.length >= 8 && !SKIP_BEAT.test(line));
  const unique: string[] = [];
  for (const line of lines) {
    const key = line.toLowerCase();
    if (unique.some((item) => item.toLowerCase() === key)) continue;
    unique.push(line.length > 90 ? `${line.slice(0, 87).trimEnd()}…` : line);
    if (unique.length === 4) break;
  }
  if (unique.length) return unique;
  const fallback = (hook.trim() || script.trim() || "Clapshot").slice(0, 90);
  return [fallback];
}

export function lookFromPrompt(hook: string, script = ""): ClipLook {
  const text = `${hook} ${script}`.toLowerCase();
  const seed = hashText(text);
  if (/night|nuit|dawn|6:14|apartment|appart|dark room|tired face/.test(text)) {
    return {
      bg: "#05060c",
      accent: [80, 140, 255],
      ink: "#e8eefc",
      label: "CLAPSHOT  NIGHT",
      zoomFrom: 1.18,
      zoomTo: 1.02,
      orbit: 32,
    };
  }
  if (/desk|bureau|notebook|carnet|sticky|id[ée]e|pipeline|30 id/.test(text)) {
    return {
      bg: "#120c08",
      accent: [232, 168, 72],
      ink: "#f6ead2",
      label: "CLAPSHOT  DESK",
      zoomFrom: 1.06,
      zoomTo: 1.2,
      orbit: 16,
    };
  }
  if (/publish|publier|thumb|bouton|x\.com|hit publish/.test(text)) {
    return {
      bg: "#070707",
      accent: [255, 59, 48],
      ink: "#f4efe6",
      label: "CLAPSHOT  REC",
      zoomFrom: 1.28,
      zoomTo: 1.04,
      orbit: 10,
    };
  }
  if (/city|ville|window|fen[êe]tre|bus|parallax/.test(text)) {
    return {
      bg: "#071016",
      accent: [64, 196, 180],
      ink: "#e7f7f4",
      label: "CLAPSHOT  CITY",
      zoomFrom: 1.1,
      zoomTo: 1.24,
      orbit: 28,
    };
  }
  const hue = seed % 360;
  const a = (deg: number) => {
    const r = Math.round(140 + 90 * Math.cos((deg * Math.PI) / 180));
    const g = Math.round(90 + 90 * Math.cos(((deg + 120) * Math.PI) / 180));
    const b = Math.round(90 + 90 * Math.cos(((deg + 240) * Math.PI) / 180));
    return [r, g, b] as [number, number, number];
  };
  return {
    bg: "#080808",
    accent: a(hue),
    ink: "#f4efe6",
    label: "CLAPSHOT  REC",
    zoomFrom: 1.08 + (seed % 12) / 100,
    zoomTo: 1.16 + (seed % 18) / 100,
    orbit: 14 + (seed % 20),
  };
}

function clampDuration(seconds: number): number {
  return Math.min(15, Math.max(6, Math.round(seconds)));
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

function rgba(rgb: [number, number, number], alpha: number): string {
  return `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${alpha})`;
}

function drawFrame(
  ctx: CanvasRenderingContext2D,
  t: number,
  duration: number,
  look: ClipLook,
  beats: string[],
) {
  const p = Math.min(1, Math.max(0, t / duration));
  const crash = Math.min(1, t / Math.max(0.8, duration * 0.12));
  const pull = p > 0.88 ? (p - 0.88) / 0.12 : 0;
  const zoom = look.zoomFrom + (look.zoomTo - look.zoomFrom) * p - pull * 0.08;
  const driftX = Math.sin(p * Math.PI * 2) * look.orbit;
  const driftY = Math.cos(p * Math.PI) * (10 + look.orbit * 0.25);
  const beatIndex = Math.min(beats.length - 1, Math.floor(p * beats.length));
  const beat = beats[beatIndex] || "Clapshot";

  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = look.bg;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  ctx.save();
  ctx.translate(WIDTH / 2 + driftX * crash, HEIGHT / 2 + driftY);
  ctx.scale(zoom, zoom);
  ctx.translate(-WIDTH / 2, -HEIGHT / 2);

  const glow = ctx.createRadialGradient(520, 220, 20, 520, 220, 560);
  glow.addColorStop(0, rgba(look.accent, 0.16 + 0.18 * Math.sin(p * Math.PI)));
  glow.addColorStop(1, rgba(look.accent, 0));
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  const pulse = 0.45 + 0.55 * (0.5 + 0.5 * Math.sin(t * Math.PI * 3));
  ctx.fillStyle = rgba(look.accent, pulse);
  ctx.beginPath();
  ctx.arc(64, 72, 10, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "rgba(255,255,255,0.55)";
  ctx.font = "600 22px Outfit, system-ui, sans-serif";
  ctx.fillText(look.label, 88, 80);

  ctx.fillStyle = look.ink;
  ctx.font = "600 48px Outfit, system-ui, sans-serif";
  const lines = wrapText(ctx, beat, WIDTH - 96);
  let y = 400;
  for (const line of lines.slice(0, 6)) {
    ctx.fillText(line, 48, y);
    y += 64;
  }

  ctx.fillStyle = "rgba(255,255,255,0.32)";
  ctx.font = "500 20px Outfit, system-ui, sans-serif";
  ctx.fillText(`${beatIndex + 1}/${beats.length}  ·  clapshot`, 48, HEIGHT - 64);
  ctx.restore();
}

function mountCanvas(): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  canvas.setAttribute("aria-hidden", "true");
  Object.assign(canvas.style, {
    position: "fixed",
    left: "0",
    top: "0",
    width: "36px",
    height: "64px",
    opacity: "0.02",
    pointerEvents: "none",
    zIndex: "-1",
  });
  document.body.appendChild(canvas);
  return canvas;
}

function captureCanvas(canvas: HTMLCanvasElement): MediaStream | null {
  const stream = canvas.captureStream?.(FPS);
  return stream && stream.getVideoTracks().length > 0 ? stream : null;
}

function fileFromChunks(chunks: BlobPart[], mime: string): File | null {
  if (!chunks.length) return null;
  const blob = new Blob(chunks, { type: mime || "video/mp4" });
  if (!blob.size) return null;
  const type = blob.type.startsWith("video/") ? blob.type : "video/mp4";
  const ext = type.includes("webm") ? "webm" : "mp4";
  return new File([blob], `clapshot.${ext}`, { type });
}

function openRecorder(stream: MediaStream, mime: string): MediaRecorder | null {
  for (const options of clipRecorderOptions(mime)) {
    try {
      return new MediaRecorder(stream, options);
    } catch {
      // Safari rejects some bitrate + codec combos.
    }
  }
  return null;
}

export async function renderHookClip(
  hook: string,
  duration = 6,
  script = "",
): Promise<File | null> {
  if (typeof document === "undefined" || typeof MediaRecorder === "undefined") {
    return null;
  }
  const seconds = clampDuration(duration);
  const look = lookFromPrompt(hook, script);
  const beats = extractClipBeats(hook, script);
  const canvas = mountCanvas();
  const ctx = canvas.getContext("2d", { alpha: false });
  if (!ctx) {
    canvas.remove();
    return null;
  }

  drawFrame(ctx, 0, seconds, look, beats);
  const stream = captureCanvas(canvas);
  if (!stream) {
    canvas.remove();
    return null;
  }

  const mime = pickClipMimeType();
  const recorder = openRecorder(stream, mime);
  if (!recorder) {
    stream.getTracks().forEach((track) => track.stop());
    canvas.remove();
    return null;
  }

  const chunks: BlobPart[] = [];
  recorder.ondataavailable = (event) => {
    if (event.data.size > 0) chunks.push(event.data);
  };

  const videoTrack = stream.getVideoTracks()[0] as MediaStreamTrack & {
    requestFrame?: () => void;
  };
  try {
    void videoTrack.applyConstraints?.({ frameRate: FPS });
  } catch {
    // Constraints are best-effort on iOS.
  }
  const startedAt = performance.now();
  let ticking = true;
  const tick = () => {
    if (!ticking) return;
    const elapsed = (performance.now() - startedAt) / 1000;
    drawFrame(ctx, Math.min(elapsed, seconds), seconds, look, beats);
    videoTrack?.requestFrame?.();
    if (elapsed < seconds && recorder.state === "recording") {
      requestAnimationFrame(tick);
    }
  };

  const recorded = new Promise<File | null>((resolve) => {
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      ticking = false;
      resolve(fileFromChunks(chunks, recorder.mimeType || mime || "video/mp4"));
    };
    recorder.onerror = () => finish();
    recorder.onstop = () => finish();
    window.setTimeout(() => {
      try {
        if (recorder.state === "recording") {
          try {
            recorder.requestData();
          } catch {
            // Safari may not implement requestData.
          }
          recorder.stop();
        }
      } catch {
        finish();
        return;
      }
      window.setTimeout(finish, 800);
    }, seconds * 1000 + 200);
  });

  try {
    recorder.start(KEYFRAME_MS);
    requestAnimationFrame(tick);
    return await recorded;
  } catch {
    try {
      if (recorder.state === "recording") recorder.stop();
    } catch {
      // already dead
    }
    return fileFromChunks(chunks, recorder.mimeType || mime || "video/mp4");
  } finally {
    ticking = false;
    stream.getTracks().forEach((track) => track.stop());
    canvas.remove();
  }
}
