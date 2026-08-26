import { Preferences } from "@capacitor/preferences";
import type {
  AIContext,
  ContentPackage,
  PromptStyleContext,
  StructurePreferences,
  UserStyleProfile,
  VoicePreference,
} from "../types/aiContext";
import { STYLE_PROFILE_VERSION } from "../types/aiContext";

const CONTEXT_STORAGE_KEY = "cf-ai-context";
const STYLE_CHANGE_EVENT = "cf-style-memory-change";

const MAX_TONES = 12;
const MAX_PLATFORMS = 6;
const MAX_VOCABULARY = 24;
const MAX_RECENT_PACKAGES = 20;
const STRUCTURE_EMA_ALPHA = 0.35;
const LENGTH_EMA_ALPHA = 0.4;

const STOP_WORDS = new Set([
  "a",
  "an",
  "and",
  "are",
  "as",
  "at",
  "be",
  "but",
  "by",
  "ce",
  "ces",
  "cette",
  "dans",
  "de",
  "des",
  "du",
  "elle",
  "en",
  "est",
  "et",
  "for",
  "from",
  "have",
  "il",
  "in",
  "is",
  "it",
  "la",
  "le",
  "les",
  "leur",
  "mais",
  "ne",
  "nos",
  "not",
  "on",
  "or",
  "ou",
  "our",
  "par",
  "pas",
  "pour",
  "que",
  "qui",
  "se",
  "son",
  "sur",
  "that",
  "the",
  "their",
  "this",
  "to",
  "un",
  "une",
  "vos",
  "was",
  "with",
  "vous",
  "your",
]);

let cachedContext: AIContext | null = null;
let hydratePromise: Promise<AIContext> | null = null;

function defaultStructurePreferences(): StructurePreferences {
  return {
    strongHook: 0.5,
    educational: 0.5,
    highEnergy: 0.5,
    narrative: 0.5,
    shortFormOptimized: 0.5,
  };
}

export function createDefaultStyleProfile(): UserStyleProfile {
  const now = new Date().toISOString();
  return {
    preferredTones: [],
    preferredPlatforms: [],
    preferredVoices: {},
    averageLengthByPlatform: {},
    vocabularyPreferences: [],
    structurePreferences: defaultStructurePreferences(),
    recentSuccessfulPackages: [],
    lastUpdatedAt: now,
    version: STYLE_PROFILE_VERSION,
  };
}

function createDefaultContext(): AIContext {
  return {
    useStyleMemory: true,
    styleProfile: createDefaultStyleProfile(),
  };
}

function normalizeStructurePreferences(
  value: Partial<StructurePreferences> | undefined,
): StructurePreferences {
  const defaults = defaultStructurePreferences();
  if (!value) return defaults;
  return {
    strongHook: clamp01(value.strongHook ?? defaults.strongHook),
    educational: clamp01(value.educational ?? defaults.educational),
    highEnergy: clamp01(value.highEnergy ?? defaults.highEnergy),
    narrative: clamp01(value.narrative ?? defaults.narrative),
    shortFormOptimized: clamp01(value.shortFormOptimized ?? defaults.shortFormOptimized),
  };
}

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(1, Math.max(0, value));
}

function mergeUniqueStrings(existing: string[], incoming: string[], max: number): string[] {
  const merged = [...incoming, ...existing];
  const seen = new Set<string>();
  const result: string[] = [];
  for (const item of merged) {
    const normalized = item.trim().toLowerCase();
    if (!normalized || seen.has(normalized)) continue;
    seen.add(normalized);
    result.push(item.trim());
    if (result.length >= max) break;
  }
  return result;
}

function extractVocabulary(script: string): string[] {
  const tokens = script
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s'-]/gu, " ")
    .split(/\s+/)
    .map((token) => token.trim())
    .filter((token) => token.length >= 4 && !STOP_WORDS.has(token));

  const counts = new Map<string, number>();
  for (const token of tokens) {
    counts.set(token, (counts.get(token) ?? 0) + 1);
  }

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, MAX_VOCABULARY)
    .map(([word]) => word);
}

function inferStructureFromScript(script: string): Partial<StructurePreferences> {
  const lower = script.toLowerCase();
  const firstLines = lower.split("\n").slice(0, 3).join(" ");
  const hasQuestion = /\?/.test(firstLines);
  const hasHookWords = /(attention|regarde|secret|astuce|tip|hook|stop scrolling)/i.test(
    firstLines,
  );

  return {
    strongHook: hasQuestion || hasHookWords ? 0.85 : 0.45,
    educational: /(comment|how to|étape|step|learn|apprendre|guide)/i.test(lower) ? 0.8 : 0.4,
    highEnergy: /(!|incroyable|wow|let's go|allez)/i.test(lower) ? 0.8 : 0.45,
    narrative: /(hier|today|story|histoire|quand j)/i.test(lower) ? 0.75 : 0.4,
    shortFormOptimized: script.length <= 900 ? 0.85 : 0.35,
  };
}

function blendStructure(
  current: StructurePreferences,
  incoming: Partial<StructurePreferences>,
): StructurePreferences {
  const keys = Object.keys(current) as (keyof StructurePreferences)[];
  const next = { ...current };
  for (const key of keys) {
    const value = incoming[key];
    if (value === undefined) continue;
    next[key] = clamp01(current[key] * (1 - STRUCTURE_EMA_ALPHA) + clamp01(value) * STRUCTURE_EMA_ALPHA);
  }
  return next;
}

function updateAverageLength(
  current: Record<string, number>,
  platform: string,
  length: number,
): Record<string, number> {
  const key = platform.trim().toLowerCase();
  const previous = current[key];
  if (previous === undefined) {
    return { ...current, [key]: length };
  }
  return {
    ...current,
    [key]: Math.round(previous * (1 - LENGTH_EMA_ALPHA) + length * LENGTH_EMA_ALPHA),
  };
}

function parseStoredContext(raw: string | null): AIContext {
  if (!raw) return createDefaultContext();
  try {
    const parsed = JSON.parse(raw) as Partial<AIContext>;
    const profile = parsed.styleProfile ?? createDefaultStyleProfile();
    return {
      useStyleMemory: parsed.useStyleMemory ?? true,
      styleProfile: {
        ...createDefaultStyleProfile(),
        ...profile,
        structurePreferences: normalizeStructurePreferences(profile.structurePreferences),
        version: profile.version ?? STYLE_PROFILE_VERSION,
      },
    };
  } catch {
    return createDefaultContext();
  }
}

async function readContextFromStorage(): Promise<AIContext> {
  const { value } = await Preferences.get({ key: CONTEXT_STORAGE_KEY });
  return parseStoredContext(value);
}

async function writeContextToStorage(context: AIContext): Promise<void> {
  await Preferences.set({
    key: CONTEXT_STORAGE_KEY,
    value: JSON.stringify(context),
  });
}

function notifyStyleMemoryChange(): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(STYLE_CHANGE_EVENT));
  }
}

async function persistContext(context: AIContext): Promise<AIContext> {
  cachedContext = context;
  await writeContextToStorage(context);
  notifyStyleMemoryChange();
  return context;
}

/**
 * Loads context from Capacitor Preferences into the in-memory cache.
 * Safe to call multiple times; subsequent calls reuse the same hydration promise.
 */
export async function hydrateAiContext(): Promise<AIContext> {
  if (cachedContext) return cachedContext;
  if (!hydratePromise) {
    hydratePromise = readContextFromStorage().then((context) => {
      cachedContext = context;
      return context;
    });
  }
  return hydratePromise;
}

/** Returns the learned style profile (hydrates storage on first access). */
export async function getStyleProfile(): Promise<UserStyleProfile> {
  const context = await hydrateAiContext();
  return context.styleProfile;
}

/** Returns the full AI context including the style-memory toggle. */
export async function getContext(): Promise<AIContext> {
  return hydrateAiContext();
}

/**
 * Learns tone, platform, length, vocabulary and structure from a content package.
 * Respects `useStyleMemory` — no-op when the toggle is off.
 */
export async function updateStyleFromPackage(pkg: ContentPackage): Promise<UserStyleProfile> {
  const context = await hydrateAiContext();
  if (!context.useStyleMemory) {
    return context.styleProfile;
  }
  if (pkg.successful === false) {
    return context.styleProfile;
  }

  const profile = { ...context.styleProfile };
  const now = new Date().toISOString();

  if (pkg.tones?.length) {
    profile.preferredTones = mergeUniqueStrings(profile.preferredTones, pkg.tones, MAX_TONES);
  }

  if (pkg.platform) {
    profile.preferredPlatforms = mergeUniqueStrings(
      profile.preferredPlatforms,
      [String(pkg.platform)],
      MAX_PLATFORMS,
    );
  }

  const scriptLength =
    pkg.length ?? (pkg.script ? pkg.script.trim().length : undefined);
  if (scriptLength !== undefined && pkg.platform) {
    profile.averageLengthByPlatform = updateAverageLength(
      profile.averageLengthByPlatform,
      String(pkg.platform),
      scriptLength,
    );
  }

  const vocabulary =
    pkg.vocabulary ?? (pkg.script ? extractVocabulary(pkg.script) : []);
  if (vocabulary.length) {
    profile.vocabularyPreferences = mergeUniqueStrings(
      profile.vocabularyPreferences,
      vocabulary,
      MAX_VOCABULARY,
    );
  }

  const structure =
    pkg.structure ?? (pkg.script ? inferStructureFromScript(pkg.script) : undefined);
  if (structure) {
    profile.structurePreferences = blendStructure(profile.structurePreferences, structure);
  }

  if (pkg.id) {
    profile.recentSuccessfulPackages = mergeUniqueStrings(
      profile.recentSuccessfulPackages,
      [pkg.id],
      MAX_RECENT_PACKAGES,
    );
  }

  if (pkg.voiceId && pkg.voiceName) {
    profile.preferredVoices = {
      ...profile.preferredVoices,
      [pkg.voiceId]: {
        voiceName: pkg.voiceName,
        usageCount: (profile.preferredVoices[pkg.voiceId]?.usageCount ?? 0) + 1,
        lastUsedAt: now,
      },
    };
  }

  profile.lastUpdatedAt = now;
  profile.version = STYLE_PROFILE_VERSION;

  const nextContext: AIContext = {
    ...context,
    styleProfile: profile,
  };
  await persistContext(nextContext);
  return profile;
}

/** Records a voice selection to reinforce future voice-over defaults. */
export async function recordVoicePreference(
  voiceId: string,
  voiceName: string,
): Promise<UserStyleProfile> {
  const context = await hydrateAiContext();
  const now = new Date().toISOString();
  const previous = context.styleProfile.preferredVoices[voiceId];

  const profile: UserStyleProfile = {
    ...context.styleProfile,
    preferredVoices: {
      ...context.styleProfile.preferredVoices,
      [voiceId]: {
        voiceName,
        usageCount: (previous?.usageCount ?? 0) + 1,
        lastUsedAt: now,
      },
    },
    lastUpdatedAt: now,
    version: STYLE_PROFILE_VERSION,
  };

  await persistContext({ ...context, styleProfile: profile });
  return profile;
}

/** Enables or disables style memory for all AI features. */
export async function setUseStyleMemory(enabled: boolean): Promise<AIContext> {
  const context = await hydrateAiContext();
  if (context.useStyleMemory === enabled) {
    return context;
  }
  return persistContext({ ...context, useStyleMemory: enabled });
}

/** Clears all learned preferences and restores factory defaults. */
export async function resetStyleMemory(): Promise<AIContext> {
  const context = await hydrateAiContext();
  return persistContext({
    useStyleMemory: context.useStyleMemory,
    styleProfile: createDefaultStyleProfile(),
  });
}

function formatStructureHints(structure: StructurePreferences): string[] {
  const hints: string[] = [];
  if (structure.strongHook >= 0.65) hints.push("accroche forte en ouverture");
  if (structure.educational >= 0.65) hints.push("ton éducatif et pédagogique");
  if (structure.highEnergy >= 0.65) hints.push("énergie élevée");
  if (structure.narrative >= 0.65) hints.push("structure narrative");
  if (structure.shortFormOptimized >= 0.65) hints.push("optimisé format court");
  return hints;
}

function topVoices(profile: UserStyleProfile, limit = 3): VoicePreference[] {
  return Object.values(profile.preferredVoices)
    .sort((a, b) => b.usageCount - a.usageCount || b.lastUsedAt.localeCompare(a.lastUsedAt))
    .slice(0, limit);
}

/**
 * Builds a compact text block for LLM system/user prompts.
 * Returns empty text when style memory is disabled.
 */
export async function buildPromptContext(): Promise<PromptStyleContext> {
  const context = await hydrateAiContext();
  const { styleProfile: profile, useStyleMemory } = context;

  if (!useStyleMemory) {
    return { enabled: false, text: "", profile };
  }

  const lines: string[] = ["Style du créateur (mémoire locale) :"];

  if (profile.preferredTones.length) {
    lines.push(`- Tons préférés : ${profile.preferredTones.join(", ")}`);
  }
  if (profile.preferredPlatforms.length) {
    lines.push(`- Plateformes habituelles : ${profile.preferredPlatforms.join(", ")}`);
  }

  const lengthEntries = Object.entries(profile.averageLengthByPlatform);
  if (lengthEntries.length) {
    const lengths = lengthEntries
      .map(([platform, avg]) => `${platform} ~${avg} car.`)
      .join(", ");
    lines.push(`- Longueurs moyennes : ${lengths}`);
  }

  const structureHints = formatStructureHints(profile.structurePreferences);
  if (structureHints.length) {
    lines.push(`- Structure : ${structureHints.join(", ")}`);
  }

  if (profile.vocabularyPreferences.length) {
    lines.push(
      `- Vocabulaire récurrent : ${profile.vocabularyPreferences.slice(0, 10).join(", ")}`,
    );
  }

  const voices = topVoices(profile);
  if (voices.length) {
    lines.push(`- Voix préférées : ${voices.map((v) => v.voiceName).join(", ")}`);
  }

  const text = lines.length > 1 ? lines.join("\n") : "";
  return { enabled: true, text, profile };
}

/** Subscribe to style-memory updates (for React hooks). */
export function subscribeStyleMemory(listener: () => void): () => void {
  if (typeof window === "undefined") {
    return () => undefined;
  }
  window.addEventListener(STYLE_CHANGE_EVENT, listener);
  return () => window.removeEventListener(STYLE_CHANGE_EVENT, listener);
}

/** Test helper — clears cache and storage. */
export async function __resetAiContextForTests(): Promise<void> {
  cachedContext = null;
  hydratePromise = null;
  await Preferences.remove({ key: CONTEXT_STORAGE_KEY });
}
