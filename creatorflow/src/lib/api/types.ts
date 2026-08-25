export type GenerateScriptRequest = {
  ideaId: string;
  title: string;
  description: string;
  platform: "youtube" | "tiktok" | "reels";
  language?: "fr" | "en";
  mode?: "generate" | "improve";
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
