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

function resolveHealthUrl(baseUrl: string): string {
  if (baseUrl.includes(".supabase.co/functions/v1")) {
    return `${baseUrl.replace(/\/$/, "")}/health`;
  }
  return `${baseUrl.replace(/\/$/, "")}/health`;
}

export async function checkApiHealth(): Promise<{
  online: boolean;
  url: string | null;
}> {
  const configured = resolveConfiguredApiUrl();
  const healthBase = resolveApiBaseUrl();
  if (!healthBase) return { online: false, url: null };

  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 12_000);
  try {
    const res = await fetch(resolveHealthUrl(healthBase), {
      method: "GET",
      signal: controller.signal,
    });
    if (!res.ok) return { online: false, url: configured };
    const data = (await res.json()) as { ok?: boolean };
    return { online: data.ok === true, url: configured };
  } catch {
    return { online: false, url: configured };
  } finally {
    window.clearTimeout(timeout);
  }
}
