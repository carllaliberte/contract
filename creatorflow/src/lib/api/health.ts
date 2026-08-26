export type ApiHealthState = "online" | "offline" | "demo";

export function resolveApiBaseUrl(): string | null {
  const configured = import.meta.env.VITE_API_URL?.trim() ?? "";
  return configured ? configured.replace(/\/$/, "") : null;
}

export async function checkApiHealth(baseUrl: string): Promise<boolean> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 12_000);
  try {
    const res = await fetch(`${baseUrl}/health`, {
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
