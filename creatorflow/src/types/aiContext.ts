import type { Language, Platform, ScriptFormat } from "../lib/api/types";

/** Learned tone fingerprint used across script generation and TTS. */
export type StyleTone =
  | "direct"
  | "educational"
  | "humorous"
  | "inspirational"
  | "casual";

/** Single remembered style snippet from a past content package. */
export type StyleMemoryEntry = {
  id: string;
  excerpt: string;
  platform: Platform;
  language: Language;
  capturedAt: string;
};

/** Persistent user style profile — the long-term "voice" of the creator. */
export type UserStyleProfile = {
  version: 1;
  tone: StyleTone;
  vocabulary: string[];
  hookPatterns: string[];
  ctaPatterns: string[];
  avgScriptLength: "short" | "medium" | "long";
  preferredLanguage: Language;
  tts: {
    voiceId: string;
    speed: number;
  };
  memory: StyleMemoryEntry[];
  sampleCount: number;
  updatedAt: string;
};

/**
 * Multi-output content bundle produced or accepted by the user.
 * Feeds StyleMemory when passed to `updateStyleFromPackage`.
 */
export type ContentPackage = {
  ideaId?: string;
  platform: Platform;
  language: Language;
  format?: ScriptFormat;
  script: string;
  titles?: string[];
  description?: string;
  hashtags?: string[];
  hooks?: string[];
  source?: "generated" | "edited" | "accepted";
  createdAt?: string;
};

/** Options when assembling an AIContext for a specific feature call. */
export type AIContextOptions = {
  platform?: Platform;
  language?: Language;
  format?: ScriptFormat;
  includeMemory?: boolean;
  memoryLimit?: number;
};

/**
 * Assembled context shared by script generation, TTS, and future AI features.
 * Serializable and ready to attach to API payloads.
 */
export type AIContext = {
  profile: UserStyleProfile;
  stylePrompt: string;
  tts: {
    voiceId: string;
    speed: number;
  };
  platform?: Platform;
  language: Language;
  memoryExcerpts: string[];
};
