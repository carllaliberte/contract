import type { Platform } from "./api/types";

/** Reels remains a stored alias; Instagram is the canonical label. */
export function normalizePlatform(platform: Platform): Platform {
  return platform === "reels" ? "instagram" : platform;
}

export const platformLabel: Record<Platform, string> = {
  youtube: "YouTube",
  tiktok: "TikTok",
  reels: "Instagram",
  instagram: "Instagram",
  x: "X",
};

export function labelForPlatform(platform: Platform | string): string {
  if (platform in platformLabel) {
    return platformLabel[platform as Platform];
  }
  return String(platform);
}
