import type { Platform } from "../lib/api/types";

/** Current schema version for migrations. */
export const STYLE_PROFILE_VERSION = 1;

/** Affinity scores (0–1) for structural patterns the creator tends to use. */
export type StructurePreferences = {
  strongHook: number;
  educational: number;
  highEnergy: number;
  narrative: number;
  shortFormOptimized: number;
};

/** A voice the creator has selected or reused over time. */
export type VoicePreference = {
  voiceName: string;
  usageCount: number;
  lastUsedAt: string;
};

/**
 * Learned style profile persisted locally.
 * Updated automatically from successful content packages and voice selections.
 */
export type UserStyleProfile = {
  preferredTones: string[];
  preferredPlatforms: string[];
  preferredVoices: Record<string, VoicePreference>;
  averageLengthByPlatform: Record<string, number>;
  vocabularyPreferences: string[];
  structurePreferences: StructurePreferences;
  /** IDs of recently successful content packages (most recent first). */
  recentSuccessfulPackages: string[];
  lastUpdatedAt: string;
  version: number;
};

/**
 * Full AI context: toggle + learned profile.
 * This is the shared brain consumed by script generation, voice-over, etc.
 */
export type AIContext = {
  /** When false, `buildPromptContext()` returns an empty string. */
  useStyleMemory: boolean;
  styleProfile: UserStyleProfile;
};

/**
 * A content unit produced or approved by the creator.
 * Used to feed automatic style learning.
 */
export type ContentPackage = {
  id: string;
  platform: Platform | string;
  /** Detected or declared tones (e.g. "éducatif", "énergique"). */
  tones?: string[];
  script?: string;
  /** Stable voice identifier (provider-specific). */
  voiceId?: string;
  voiceName?: string;
  /** Script length in characters (used for per-platform averages). */
  length?: number;
  vocabulary?: string[];
  structure?: Partial<StructurePreferences>;
  createdAt?: string;
  /**
   * When true (default), the package contributes to style learning.
   * Set to false for experiments the creator does not want to reinforce.
   */
  successful?: boolean;
};

/** Prompt-ready context returned by `buildPromptContext()`. */
export type PromptStyleContext = {
  enabled: boolean;
  text: string;
  profile: UserStyleProfile;
};
