const WIDTH = 720;
const HEIGHT = 1280;
const FPS = 30;

const MIME_CANDIDATES = [
  "video/mp4;codecs=avc1.42E01E",
  "video/mp4;codecs=avc1",
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

function drawFrame(
  ctx: CanvasRenderingContext2D,
  t: number,
  duration: number,
  hook: string,
) {
  const p = Math.min(1, Math.max(0, t / duration));
  const zoom = 1.08 + p * 0.22;
  const driftX = Math.sin(p * Math.PI * 2) * 24;
  const driftY = Math.cos(p * Math.PI) * 14;

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

export async function renderHookClip(
  hook: string,
  duration = 6,
  _script = "",
): Promise<File | null> {
  if (typeof document === "undefined" || typeof MediaRecorder === "undefined") {
    return null;
  }
  const seconds = clampDuration(duration);
  const canvas = mountCanvas();
  const ctx = canvas.getContext("2d", { alpha: false });
  if (!ctx) {
    canvas.remove();
    return null;
  }

  drawFrame(ctx, 0, seconds, hook);
  const stream = captureCanvas(canvas);
  if (!stream) {
    canvas.remove();
    return null;
  }

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
      stream.getTracks().forEach((track) => track.stop());
      canvas.remove();
      return null;
    }
  }

  const chunks: BlobPart[] = [];
  recorder.ondataavailable = (event) => {
    if (event.data.size > 0) chunks.push(event.data);
  };

  const videoTrack = stream.getVideoTracks()[0] as MediaStreamTrack & {
    requestFrame?: () => void;
  };
  const startedAt = performance.now();
  let ticking = true;
  const tick = () => {
    if (!ticking) return;
    const elapsed = (performance.now() - startedAt) / 1000;
    drawFrame(ctx, Math.min(elapsed, seconds), seconds, hook);
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
    recorder.start(250);
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
