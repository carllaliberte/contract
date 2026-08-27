import { Capacitor } from "@capacitor/core";
import { Share } from "@capacitor/share";
import type { Idea } from "../data/demo";

export type ShareDestination = "x" | "instagram" | "tiktok" | "copy";

export const SHARE_DESTINATIONS: ShareDestination[] = [
  "x",
  "instagram",
  "tiktok",
  "copy",
];

export function buildSharePackText(idea: Idea): string {
  const parts = [idea.title.trim()];
  if (idea.script?.trim()) {
    parts.push("", idea.script.trim());
  } else if (idea.description.trim()) {
    parts.push("", idea.description.trim());
  }
  return parts.join("\n").trim();
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
  const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
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
  const text = buildSharePackText(idea);
  if (!text) return false;

  if (destination === "copy") {
    return copyToClipboard(text);
  }

  if (destination === "x") {
    return shareToX(text);
  }

  const title = idea.title.trim() || "CreatorFlow";
  return shareViaSystemShare(title, text);
}
