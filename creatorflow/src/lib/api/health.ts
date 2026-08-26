export type ApiHealthState = "online" | "offline" | "demo";

/** Raw value from build-time env (e.g. .../functions/v1/generate-script). */
export function resolveConfiguredApiUrl(): string | null {
  const configured = import.meta.env.VITE_API_URL?.trim() ?? "";
  return configured ? configured.replace(/\/$/, "") : null;
}

/** Base used for health checks (Supabase → .../functions/v1). */
export function resolveApiBaseUrl(): string | null {
  const configured = resolveConfiguredApiUrl();
  if (!configured) return null;
  if (configured.includes(".supabase.co/functions/v1")) {
    return configured.replace(/\/functions\/v1(?:\/.*)?$/, "/functions/v1");
  }
  return configured;
}

export function resolveHealthUrl(baseUrl: string): string {
  if (baseUrl.includes(".supabase.co/functions/v1")) {
    return `${baseUrl.replace(/\/$/, "")}/health`;
  }
  return `${baseUrl.replace(/\/$/, "")}/health`;
}

export async function checkApiHealth(baseUrl: string): Promise<boolean> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 12_000);
  const healthUrl = resolveHealthUrl(baseUrl);
  try {
    const res = await fetch(healthUrl, {
      method: "GET",
      signal: controller.signal,
    });
    if (!res.ok) return false;
    const data = (await res.json()) as { ok?: boolean };
    return data.ok === true;
  } catch {
    return false;
  } finally {
    window.clearTimeout(timeout);
  }
}
