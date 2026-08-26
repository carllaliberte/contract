export type ApiHealthState = "online" | "offline" | "demo";

export function resolveApiBaseUrl(): string | null {
  const configured = import.meta.env.VITE_API_URL?.trim() ?? "";
  if (!configured) return null;
  const base = configured.replace(/\/$/, "");
  if (base.includes(".supabase.co/functions/v1")) {
    return base.replace(/\/functions\/v1(?:\/.*)?$/, "/functions/v1");
  }
  return base;
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
