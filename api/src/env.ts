import { LIMITS } from "./limits.js";

function parseList(raw: string | undefined, fallback: string[]): string[] {
  if (!raw?.trim()) return fallback;
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

const memoryStore =
  process.env.MEMORY_STORE === "true" ||
  !process.env.SUPABASE_URL ||
  !process.env.SUPABASE_SERVICE_ROLE_KEY;

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
    "capacitor://localhost",
    "https://localhost",
  ]),
  appleClientId:
    process.env.APPLE_CLIENT_ID ?? "com.carllaliberte.creatorflow",
  appleBundleId:
    process.env.APPLE_BUNDLE_ID ?? "com.carllaliberte.creatorflow",
  memoryStore,
  mockLlm: process.env.MOCK_LLM === "true" || !process.env.OPENAI_API_KEY,
  mockAppleAuth:
    process.env.MOCK_APPLE_AUTH === "true" || memoryStore,
  mockIap: process.env.MOCK_IAP === "true" || memoryStore,
};

export function currentMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}
