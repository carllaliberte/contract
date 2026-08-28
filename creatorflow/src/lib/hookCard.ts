export async function renderHookCard(hook: string): Promise<Blob> {
  const width = 1080;
  const height = 1350;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas");

  ctx.fillStyle = "#070707";
  ctx.fillRect(0, 0, width, height);

  const glow = ctx.createRadialGradient(820, 180, 40, 820, 180, 520);
  glow.addColorStop(0, "rgba(255,59,48,0.28)");
  glow.addColorStop(1, "rgba(255,59,48,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = "#ff3b30";
  ctx.beginPath();
  ctx.arc(88, 92, 14, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "rgba(255,255,255,0.55)";
  ctx.font = "600 28px Outfit, system-ui, sans-serif";
  ctx.fillText("CLAPSHOT", 120, 102);

  ctx.fillStyle = "#f4efe6";
  ctx.font = "600 72px Outfit, system-ui, sans-serif";
  const words = hook.trim() || "Clapshot";
  const lines = wrapText(ctx, words, width - 160);
  let y = 420;
  for (const line of lines.slice(0, 6)) {
    ctx.fillText(line, 80, y);
    y += 92;
  }

  ctx.fillStyle = "rgba(255,255,255,0.4)";
  ctx.font = "500 28px Outfit, system-ui, sans-serif";
  ctx.fillText("clapshot", 80, height - 80);

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((value) => {
      if (value) resolve(value);
      else reject(new Error("blob"));
    }, "image/png");
  });
  return blob;
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (ctx.measureText(next).width <= maxWidth) {
      current = next;
    } else {
      if (current) lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines;
}
