export type Platform = "youtube" | "tiktok" | "reels";
export type Language = "fr" | "en";
export type GenerateMode = "generate" | "improve";

export type GenerateScriptRequest = {
  ideaId: string;
  title: string;
  description: string;
  platform: Platform;
  language?: Language;
  mode?: GenerateMode;
  existingScript?: string;
};

export type AiUsageSnapshot = {
  count: number;
  limit: number;
  remaining: number;
};

export type GenerateScriptResponse = {
  script: string;
  usage: AiUsageSnapshot;
  model: string;
};

export type GenerateScriptErrorCode =
  | "LIMIT_REACHED"
  | "UNAUTHORIZED"
  | "BAD_REQUEST"
  | "PROVIDER_ERROR";

export type GenerateScriptErrorBody = {
  error: GenerateScriptErrorCode;
  message: string;
  usage?: AiUsageSnapshot;
};

export function isPlatform(value: string): value is Platform {
  return value === "youtube" || value === "tiktok" || value === "reels";
}

export function isLanguage(value: string): value is Language {
  return value === "fr" || value === "en";
}

export function isGenerateMode(value: string): value is GenerateMode {
  return value === "generate" || value === "improve";
}
