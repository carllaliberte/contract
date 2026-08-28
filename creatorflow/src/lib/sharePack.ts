import { Capacitor } from "@capacitor/core";
import { Share } from "@capacitor/share";
import type { Idea } from "../data/demo";
import { fetchGeneratedClipFile } from "./api/generateClip";
import { fetchGeneratedPoster } from "./api/generatePoster";
import { renderHookCard } from "./hookCard";

export type ShareDestination = "x" | "instagram" | "tiktok";

export const SHARE_DESTINATIONS: ShareDestination[] = ["x", "instagram", "tiktok"];

const IG_CAPTION_MAX = 2200;
const X_TEXT_MAX = 280;

function formatHashtags(tags: string[] | undefined): string {
  const raw = tags?.length ? tags : ["#Clapshot"];
  const unique = new Set<string>();
  for (const tag of raw) {
    const trimmed = tag.trim();
    if (!trimmed) continue;
    const withHash = trimmed.startsWith("#")
      ? trimmed
      : `#${trimmed.replace(/\s+/g, "")}`;
    unique.add(withHash);
  }
  if (![...unique].some((tag) => tag.toLowerCase() === "#clapshot")) {
    unique.add("#Clapshot");
  }
  return [...unique].join(" ");
}

function clip(text: string, max: number): string {
  if (text.length <= max) return text;
  return `${text.slice(0, Math.max(0, max - 1)).trimEnd()}…`;
}

export function buildSharePackText(
  idea: Idea,
  destination?: ShareDestination,
): string {
  if (destination === "instagram" || destination === "tiktok") {
    const hook = idea.packHooks?.[0]?.trim();
    const caption = idea.packCaption?.trim();
    const hashtags = formatHashtags(idea.packHashtags);
    const body =
      caption ||
      idea.description.trim() ||
      idea.script?.trim() ||
      "";
    const parts = [hook, body, hashtags].filter(Boolean) as string[];
    if (parts.length === 0 && idea.title.trim()) parts.push(idea.title.trim());
    return clip(parts.join("\n\n").trim(), IG_CAPTION_MAX);
  }

  const hook = idea.packHooks?.[0]?.trim();
  const caption = idea.packCaption?.trim();
  const body = caption || hook || idea.title.trim();
  const hashtags = formatHashtags(idea.packHashtags);
  return clip([body, hashtags].filter(Boolean).join("\n\n").trim(), X_TEXT_MAX);
}

export function sharePackHasContent(idea: Idea): boolean {
  return Boolean(
    idea.title.trim() ||
      idea.script?.trim() ||
      idea.description.trim() ||
      idea.packCaption?.trim() ||
      idea.packHooks?.some((h) => h.trim()) ||
      idea.packHashtags?.some((h) => h.trim()),
  );
}

async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

function downloadBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = name;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1500);
}

async function posterFor(idea: Idea): Promise<Blob> {
  const hook = idea.packHooks?.[0]?.trim() || idea.title;
  return (await fetchGeneratedPoster(hook)) ?? renderHookCard(hook);
}

async function clipFor(idea: Idea): Promise<File | null> {
  const hook = idea.packHooks?.[0]?.trim() || idea.title;
  const script =
    idea.script?.trim() || idea.packCaption?.trim() || idea.description.trim();
  return fetchGeneratedClipFile(hook, 6, script);
}

export async function shareToX(text: string, idea?: Idea): Promise<boolean> {
  if (!idea) return false;
  const clip = await clipFor(idea);
  if (!clip) return false;
  try {
    const payload = { text, files: [clip], title: "Clapshot" };
    if (typeof navigator !== "undefined" && navigator.canShare?.(payload)) {
      await navigator.share(payload);
      return true;
    }
    downloadBlob(clip, "clapshot.mp4");
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") return true;
    downloadBlob(clip, "clapshot.mp4");
  }
  const url = `https://x.com/intent/tweet?text=${encodeURIComponent(text)}`;
  window.open(url, Capacitor.isNativePlatform() ? "_system" : "_blank", "noopener,noreferrer");
  return true;
}

export async function shareViaSystemShare(title: string, text: string): Promise<boolean> {
  try {
    if (Capacitor.isNativePlatform()) {
      await Share.share({ title, text, dialogTitle: title });
      return true;
    }
    if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
      await navigator.share({ title, text });
      return true;
    }
    return copyToClipboard(text);
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") return true;
    return copyToClipboard(text);
  }
}

export async function sharePack(idea: Idea, destination: ShareDestination): Promise<boolean> {
  const text = buildSharePackText(idea, destination);
  if (!text) return false;

  if (destination === "instagram" || destination === "tiktok") {
    await copyToClipboard(text);
    try {
      downloadBlob(await posterFor(idea), "clapshot.png");
    } catch {
      // Caption still copies.
    }
    return shareViaSystemShare("Clapshot", text);
  }

  return shareToX(text, idea);
}
