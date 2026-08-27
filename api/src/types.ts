export type Platform = "youtube" | "tiktok" | "reels" | "instagram" | "x";
export type Language = "fr" | "en";
export type GenerateMode = "generate" | "improve";
export type ScriptFormat = "short" | "long";
export type PlanId = "free" | "pro";

export type GenerateScriptRequest = {
  ideaId: string;
  title: string;
  description: string;
  platform: Platform;
  language?: Language;
  mode?: GenerateMode;
  existingScript?: string;
  format?: ScriptFormat;
  durationMinutes?: 8 | 12 | 20 | 30;
  /** Style memory prompt from AIContext (client-side). */
  styleContext?: string;
  sourceUrl?: string;
  sourceText?: string;
};

export type FormatQuota = {
  count: number;
  limit: number;
  remaining: number;
};

export type AiUsageSnapshot = {
  short: FormatQuota;
  long: FormatQuota;
  plan: PlanId;
};

export type GenerateScriptResponse = {
  script: string;
  usage: AiUsageSnapshot;
  model: string;
};

export type GenerateScriptErrorCode =
  | "LIMIT_REACHED"
  | "RATE_LIMITED"
  | "UNAUTHORIZED"
  | "BAD_REQUEST"
  | "PROVIDER_ERROR";

export type GenerateScriptErrorBody = {
  error: GenerateScriptErrorCode;
  message: string;
  usage?: AiUsageSnapshot;
};

export function isPlatform(value: string): value is Platform {
  return (
    value === "youtube" ||
    value === "tiktok" ||
    value === "reels" ||
    value === "instagram" ||
    value === "x"
  );
}

export function isLanguage(value: string): value is Language {
  return value === "fr" || value === "en";
}

export function isGenerateMode(value: string): value is GenerateMode {
  return value === "generate" || value === "improve";
}

export function isScriptFormat(value: string): value is ScriptFormat {
  return value === "short" || value === "long";
}

export function isLongDuration(value: number): value is 8 | 12 | 20 | 30 {
  return value === 8 || value === 12 || value === 20 || value === 30;
}
