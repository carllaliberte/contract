import { Capacitor } from "@capacitor/core";
import { Share } from "@capacitor/share";
import type { Idea } from "../data/demo";

export type ShareDestination = "x" | "instagram" | "tiktok";

export const SHARE_DESTINATIONS: ShareDestination[] = ["x", "instagram", "tiktok"];

const IG_CAPTION_MAX = 2200;
const X_TEXT_MAX = 280;

function formatHashtags(tags: string[] | undefined): string {
  const raw = tags?.length ? tags : ["#Clapshot"];
  const unique = new Set<
    string
  >();
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
  const body = hook || caption || idea.title.trim();
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

export async function shareToX(text: string): Promise<boolean> {
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
    return shareViaSystemShare("Clapshot", text);
  }

  return shareToX(text);
}
