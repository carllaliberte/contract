import type {
  AIContext,
  AIContextOptions,
  ContentPackage,
  StyleMemoryEntry,
  StyleTone,
  UserStyleProfile,
} from "../types/aiContext";
import type { Language } from "../lib/api/types";
import { readSavedLocale } from "../i18n/locales";

const STORAGE_KEY = "cf-style-profile";
const STYLE_EVENT = "cf-style-profile-change";

const MAX_VOCABULARY = 40;
const MAX_HOOK_PATTERNS = 12;
const MAX_CTA_PATTERNS = 8;
const MAX_MEMORY_ENTRIES = 24;
const DEFAULT_VOICE_ID = "alloy";
const DEFAULT_TTS_SPEED = 1;

const STOP_WORDS = new Set([
  "a",
  "au",
  "aux",
  "avec",
  "ce",
  "ces",
  "cette",
  "dans",
  "de",
  "des",
  "du",
  "en",
  "et",
  "est",
  "for",
  "il",
  "la",
  "le",
  "les",
  "on",
  "ou",
  "par",
  "pour",
  "que",
  "qui",
  "se",
  "sur",
  "the",
  "to",
  "un",
  "une",
  "vos",
  "vous",
  "your",
]);

function readLanguage(): Language {
  return readSavedLocale();
}

function createDefaultProfile(): UserStyleProfile {
  const now = new Date().toISOString();
  return {
    version: 1,
    tone: "direct",
    vocabulary: [],
    hookPatterns: [],
    ctaPatterns: [],
    avgScriptLength: "medium",
    preferredLanguage: readLanguage(),
    tts: {
      voiceId: DEFAULT_VOICE_ID,
      speed: DEFAULT_TTS_SPEED,
    },
    memory: [],
    sampleCount: 0,
    updatedAt: now,
  };
}

function readProfile(): UserStyleProfile {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return createDefaultProfile();
    const parsed = JSON.parse(raw) as Partial<UserStyleProfile>;
    if (parsed.version !== 1) return createDefaultProfile();
    return {
      ...createDefaultProfile(),
      ...parsed,
      tts: {
        voiceId: parsed.tts?.voiceId ?? DEFAULT_VOICE_ID,
        speed: parsed.tts?.speed ?? DEFAULT_TTS_SPEED,
      },
      memory: Array.isArray(parsed.memory) ? parsed.memory : [],
      vocabulary: Array.isArray(parsed.vocabulary) ? parsed.vocabulary : [],
      hookPatterns: Array.isArray(parsed.hookPatterns) ? parsed.hookPatterns : [],
      ctaPatterns: Array.isArray(parsed.ctaPatterns) ? parsed.ctaPatterns : [],
    };
  } catch {
    return createDefaultProfile();
  }
}

function writeProfile(profile: UserStyleProfile): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  window.dispatchEvent(new Event(STYLE_EVENT));
}

function uniqueTail(values: string[], limit: number): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (let i = values.length - 1; i >= 0; i -= 1) {
    const normalized = values[i].trim();
    if (!normalized) continue;
    const key = normalized.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.unshift(normalized);
    if (result.length >= limit) break;
  }
  return result;
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s'-]/gu, " ")
    .split(/\s+/)
    .filter((word) => word.length > 3 && !STOP_WORDS.has(word));
}

function extractHook(script: string): string | null {
  const lines = script
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  if (lines.length === 0) return null;

  const hookLine =
    lines.find((line) => /^hook\b/i.test(line)) ??
    lines.find((line) => /^(chapitre|chapter)\s*0/i.test(line)) ??
    lines[0];

  return hookLine.replace(/^hook\s*:\s*/i, "").trim() || null;
}

function extractCta(script: string): string | null {
  const lines = script
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  if (lines.length === 0) return null;

  const ctaLine =
    [...lines]
      .reverse()
      .find((line) => /^cta\b/i.test(line) || /\b(abonne|subscribe|follow|suis)\b/i.test(line)) ??
    lines[lines.length - 1];

  return ctaLine.replace(/^cta\s*:\s*/i, "").trim() || null;
}

function inferScriptLength(script: string): UserStyleProfile["avgScriptLength"] {
  const words = script.trim().split(/\s+/).filter(Boolean).length;
  if (words < 120) return "short";
  if (words < 350) return "medium";
  return "long";
}

function blendScriptLength(
  current: UserStyleProfile["avgScriptLength"],
  next: UserStyleProfile["avgScriptLength"],
): UserStyleProfile["avgScriptLength"] {
  const rank = { short: 0, medium: 1, long: 2 };
  const blended = Math.round((rank[current] + rank[next]) / 2);
  if (blended <= 0) return "short";
  if (blended >= 2) return "long";
  return "medium";
}

function inferTone(script: string, current: StyleTone): StyleTone {
  const sample = script.toLowerCase();
  if (/\b(lol|mdr|fun|drôle|humou)\b/.test(sample)) return "humorous";
  if (/\b(apprend|learn|tutorial|guide|étape|step)\b/.test(sample)) {
    return "educational";
  }
  if (/\b(rêve|inspire|motiv|dream|believe)\b/.test(sample)) {
    return "inspirational";
  }
  if (/\b(salut|hey|coucou|yo)\b/.test(sample)) return "casual";
  return current;
}

function mergeVocabulary(existing: string[], script: string, titles?: string[]): string[] {
  const fromScript = tokenize(script);
  const fromTitles = (titles ?? []).flatMap((title) => tokenize(title));
  const merged = [...existing, ...fromScript, ...fromTitles];
  const frequency = new Map<string, number>();
  for (const word of merged) {
    frequency.set(word, (frequency.get(word) ?? 0) + 1);
  }
  return [...frequency.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, MAX_VOCABULARY)
    .map(([word]) => word);
}

function promptLanguage(language: Language): "fr" | "en" {
  return language === "fr" || language.startsWith("fr-") ? "fr" : "en";
}

function buildStylePrompt(profile: UserStyleProfile, language: Language): string {
  const toneLabel: Record<StyleTone, { fr: string; en: string }> = {
    direct: { fr: "direct et punchy", en: "direct and punchy" },
    educational: { fr: "pédagogique et clair", en: "educational and clear" },
    humorous: { fr: "léger et humoristique", en: "light and humorous" },
    inspirational: { fr: "inspirant et motivant", en: "inspirational and motivating" },
    casual: { fr: "décontracté et conversationnel", en: "casual and conversational" },
  };

  const promptLang = promptLanguage(language);
  const tone = toneLabel[profile.tone][promptLang];
  const vocab =
    profile.vocabulary.length > 0
      ? profile.vocabulary.slice(0, 12).join(", ")
      : promptLang === "fr"
        ? "aucun mot récurrent détecté"
        : "no recurring vocabulary detected";

  const hooks =
    profile.hookPatterns.length > 0
      ? profile.hookPatterns.slice(-3).join(" | ")
      : promptLang === "fr"
        ? "hooks percutants"
        : "punchy hooks";

  const ctas =
    profile.ctaPatterns.length > 0
      ? profile.ctaPatterns.slice(-2).join(" | ")
      : promptLang === "fr"
        ? "CTA naturels"
        : "natural CTAs";

  if (promptLang === "fr") {
    return [
      "Style du créateur à respecter :",
      `- Ton : ${tone}`,
      `- Longueur habituelle : ${profile.avgScriptLength}`,
      `- Vocabulaire récurrent : ${vocab}`,
      `- Hooks typiques : ${hooks}`,
      `- CTAs typiques : ${ctas}`,
    ].join("\n");
  }

  return [
    "Creator style to respect:",
    `- Tone: ${tone}`,
    `- Usual length: ${profile.avgScriptLength}`,
    `- Recurring vocabulary: ${vocab}`,
    `- Typical hooks: ${hooks}`,
    `- Typical CTAs: ${ctas}`,
  ].join("\n");
}

function filterMemory(
  memory: StyleMemoryEntry[],
  options: AIContextOptions,
): StyleMemoryEntry[] {
  return memory.filter((entry) => {
    if (options.platform && entry.platform !== options.platform) return false;
    if (options.language && entry.language !== options.language) return false;
    return true;
  });
}

export function getStyleProfile(): UserStyleProfile {
  return readProfile();
}

export function getContext(options: AIContextOptions = {}): AIContext {
  const profile = readProfile();
  const language = options.language ?? profile.preferredLanguage;
  const includeMemory = options.includeMemory !== false;
  const memoryLimit = options.memoryLimit ?? 3;

  const memoryExcerpts = includeMemory
    ? filterMemory(profile.memory, options)
        .slice(-memoryLimit)
        .map((entry) => entry.excerpt)
    : [];

  return {
    profile,
    stylePrompt: buildStylePrompt(profile, language),
    tts: { ...profile.tts },
    platform: options.platform,
    language,
    memoryExcerpts,
  };
}

export function updateStyleFromPackage(pkg: ContentPackage): UserStyleProfile {
  const current = readProfile();
  const hook = extractHook(pkg.script);
  const cta = extractCta(pkg.script);
  const scriptLength = inferScriptLength(pkg.script);

  const memoryEntry: StyleMemoryEntry | null = hook
    ? {
        id: crypto.randomUUID(),
        excerpt: hook,
        platform: pkg.platform,
        language: pkg.language,
        capturedAt: pkg.createdAt ?? new Date().toISOString(),
      }
    : null;

  const nextMemory = memoryEntry
    ? [...current.memory, memoryEntry].slice(-MAX_MEMORY_ENTRIES)
    : current.memory;

  const updated: UserStyleProfile = {
    ...current,
    tone: inferTone(pkg.script, current.tone),
    vocabulary: mergeVocabulary(current.vocabulary, pkg.script, pkg.titles),
    hookPatterns: hook
      ? uniqueTail([...current.hookPatterns, hook], MAX_HOOK_PATTERNS)
      : current.hookPatterns,
    ctaPatterns: cta
      ? uniqueTail([...current.ctaPatterns, cta], MAX_CTA_PATTERNS)
      : current.ctaPatterns,
    avgScriptLength: blendScriptLength(current.avgScriptLength, scriptLength),
    preferredLanguage: pkg.language,
    memory: nextMemory,
    sampleCount: current.sampleCount + 1,
    updatedAt: new Date().toISOString(),
  };

  writeProfile(updated);
  return updated;
}

export function updateTtsPreferences(prefs: {
  voiceId?: string;
  speed?: number;
}): UserStyleProfile {
  const current = readProfile();
  const updated: UserStyleProfile = {
    ...current,
    tts: {
      voiceId: prefs.voiceId ?? current.tts.voiceId,
      speed: prefs.speed ?? current.tts.speed,
    },
    updatedAt: new Date().toISOString(),
  };
  writeProfile(updated);
  return updated;
}

export function resetStyleProfile(): UserStyleProfile {
  const fresh = createDefaultProfile();
  writeProfile(fresh);
  return fresh;
}

export function subscribeStyleProfile(listener: () => void): () => void {
  window.addEventListener(STYLE_EVENT, listener);
  return () => window.removeEventListener(STYLE_EVENT, listener);
}

/** Singleton-style export for feature modules (script gen, TTS, etc.). */
export const aiContext = {
  getStyleProfile,
  getContext,
  updateStyleFromPackage,
  updateTtsPreferences,
  resetStyleProfile,
  subscribeStyleProfile,
};
