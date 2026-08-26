const GITHUB_PAGES_ORIGIN = "https://carllaliberte.github.io";
const IOS_CALLBACK_PATH = "/contract/creatorflow/auth/apple";

function configuredApiUrl(): string {
  return import.meta.env.VITE_API_URL?.trim() ?? "";
}

function isSupabaseFunctionsUrl(url: string): boolean {
  return url.includes("/functions/v1/");
}

function isIosCallbackUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return (
      parsed.origin === GITHUB_PAGES_ORIGIN &&
      parsed.pathname.replace(/\/$/, "") === IOS_CALLBACK_PATH
    );
  } catch {
    return (
      url.includes("carllaliberte.github.io") &&
      url.includes("/contract/creatorflow/auth/apple")
    );
  }
}

function stripGenerateScriptSuffix(url: string): string {
  return url
    .replace(/\/ai\/generate-script\/?$/, "")
    .replace(/\/generate-script\/?$/, "")
    .replace(/\/$/, "");
}

/** API origin without script path. Null when VITE_API_URL is unset. */
export function resolveApiOrigin(): string | null {
  const configured = configuredApiUrl();
  if (!configured) return null;

  if (isSupabaseFunctionsUrl(configured)) {
    return configured.replace(/\/functions\/v1\/.*$/, "") || null;
  }

  return stripGenerateScriptSuffix(configured) || null;
}

/** Script generation endpoint (Edge Function URL or local Hono API via Vite proxy). */
export function resolveGenerateScriptUrl(): string {
  const configured = configuredApiUrl();
  if (!configured) return "/ai/generate-script";

  if (
    configured.endsWith("/generate-script") ||
    configured.endsWith("/ai/generate-script")
  ) {
    return configured;
  }

  const origin = resolveApiOrigin();
  if (!origin) return "/ai/generate-script";

  if (isSupabaseFunctionsUrl(configured) || origin.includes(".supabase.co")) {
    return `${origin}/functions/v1/generate-script`;
  }

  return `${origin}/ai/generate-script`;
}

/** Apple token exchange endpoint — never the GitHub Pages iOS callback page. */
export function resolveAppleAuthUrl(): string {
  const dedicated = import.meta.env.VITE_AUTH_APPLE_URL?.trim();
  if (dedicated) {
    if (isIosCallbackUrl(dedicated)) {
      throw new Error(
        "VITE_AUTH_APPLE_URL must not point to the iOS web callback page",
      );
    }
    return dedicated;
  }

  const configured = configuredApiUrl();
  if (!configured) return "/auth/apple";

  if (configured.endsWith("/generate-script")) {
    if (isSupabaseFunctionsUrl(configured)) {
      return configured.replace(/\/generate-script\/?$/, "/auth-apple");
    }
    const origin = stripGenerateScriptSuffix(configured);
    const url = `${origin}/auth/apple`;
    if (isIosCallbackUrl(url)) {
      throw new Error("Resolved Apple auth URL is the iOS callback page");
    }
    return url;
  }

  if (configured.endsWith("/ai/generate-script")) {
    const origin = configured.replace(/\/ai\/generate-script\/?$/, "");
    return `${origin}/auth/apple`;
  }

  const origin = resolveApiOrigin();
  if (!origin) return "/auth/apple";

  if (isSupabaseFunctionsUrl(configured) || origin.includes(".supabase.co")) {
    return `${origin}/functions/v1/auth-apple`;
  }

  const url = `${origin}/auth/apple`;
  if (isIosCallbackUrl(url)) {
    throw new Error("Resolved Apple auth URL is the iOS callback page");
  }
  return url;
}

/** Health check endpoint for the configured API backend. */
export function resolveHealthUrl(): string {
  const configured = configuredApiUrl();
  if (!configured) return "/health";

  if (
    configured.endsWith("/generate-script") &&
    isSupabaseFunctionsUrl(configured)
  ) {
    return configured.replace(/\/generate-script\/?$/, "/health");
  }

  const origin = resolveApiOrigin();
  if (!origin) return "/health";

  if (origin.includes(".supabase.co")) {
    return `${origin}/functions/v1/health`;
  }

  return `${origin}/health`;
}
