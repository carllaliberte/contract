import type { AiUsageSnapshot } from "./types";
import { getAuthToken } from "../auth/session";

function resolveApiBase(): string {
  const apiBase = import.meta.env.VITE_API_URL?.trim();
  if (apiBase) return apiBase.replace(/\/$/, "");
  return "";
}

export type ProfileResponse = {
  userId: string;
  plan: "free" | "pro";
  usage: AiUsageSnapshot;
};

export async function fetchProfile(): Promise<ProfileResponse | null> {
  const token = await getAuthToken();
  if (!token) return null;

  const base = resolveApiBase();
  const url = `${base}/profile`;

  try {
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) return null;
    return (await response.json()) as ProfileResponse;
  } catch {
    return null;
  }
}
