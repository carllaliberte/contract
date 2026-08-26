export function resolveApiBaseUrl(): string | null {
  const configured = import.meta.env.VITE_API_URL?.trim() ?? "";
  if (!configured) return null;
  return configured.replace(/\/$/, "");
}

export async function checkApiHealth(): Promise<{
  online: boolean;
  url: string | null;
}> {
  const base = resolveApiBaseUrl();
  if (!base) return { online: false, url: null };

  try {
    const res = await fetch(`${base}/health`, { method: "GET" });
    if (!res.ok) return { online: false, url: base };
    const data = (await res.json()) as { ok?: boolean };
    return { online: data.ok === true, url: base };
  } catch {
    return { online: false, url: base };
  }
}
