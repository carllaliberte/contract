import { LIMITS } from "./limits.js";

function parseList(raw: string | undefined, fallback: string[]): string[] {
  if (!raw?.trim()) return fallback;
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export const env = {
  port: Number(process.env.PORT ?? 3000),
  supabaseUrl: process.env.SUPABASE_URL ?? "",
  supabaseAnonKey: process.env.SUPABASE_ANON_KEY ?? "",
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
  openaiApiKey: process.env.OPENAI_API_KEY ?? "",
  openaiModel: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
  monthlyAiLimit: Number(process.env.MONTHLY_AI_LIMIT ?? LIMITS.free),
  monthlyAiLimitPro: Number(process.env.MONTHLY_AI_LIMIT_PRO ?? LIMITS.pro),
  corsOrigins: parseList(process.env.CORS_ORIGINS, [
    "https://carllaliberte.github.io",
    "http://localhost:5173",
  ]),
  memoryStore:
    process.env.MEMORY_STORE === "true" ||
    !process.env.SUPABASE_URL ||
    !process.env.SUPABASE_SERVICE_ROLE_KEY,
  mockLlm: process.env.MOCK_LLM === "true" || !process.env.OPENAI_API_KEY,
  appleClientId:
    process.env.APPLE_CLIENT_ID ?? "com.carllaliberte.creatorflow",
  appleAuthStub: process.env.APPLE_AUTH_STUB === "true",
  iapAppleStub: process.env.IAP_APPLE_STUB === "true",
  iapAppleStubAcceptUnsigned:
    process.env.IAP_APPLE_STUB_ACCEPT_UNSIGNED === "true",
  appleIapIssuerId: process.env.APPLE_IAP_ISSUER_ID ?? "",
  appleIapKeyId: process.env.APPLE_IAP_KEY_ID ?? "",
  appleIapPrivateKey: process.env.APPLE_IAP_PRIVATE_KEY ?? "",
  aiRateLimitWindowMs: Number(process.env.AI_RATE_LIMIT_WINDOW_MS ?? 60_000),
  aiRateLimitMaxRequests: Number(process.env.AI_RATE_LIMIT_MAX_REQUESTS ?? 6),
};

export function currentMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}
