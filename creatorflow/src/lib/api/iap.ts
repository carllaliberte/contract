import type { AiUsageSnapshot } from "./types";
import { getAuthToken } from "../auth/session";

function resolveApiBase(): string {
  const apiBase = import.meta.env.VITE_API_URL?.trim();
  if (apiBase) return apiBase.replace(/\/$/, "");
  return "";
}

async function authHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  const token = await getAuthToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

export type ValidatePurchaseResponse = {
  plan: "free" | "pro";
  usage: AiUsageSnapshot;
  productId: string;
  expiresAt?: string | null;
};

export type RestorePurchaseResponse = {
  plan: "free" | "pro";
  usage: AiUsageSnapshot;
  activeProductId: string | null;
};

export async function validateApplePurchase(input: {
  productId: string;
  signedTransaction: string;
}): Promise<ValidatePurchaseResponse> {
  const base = resolveApiBase();
  const url = `${base}/iap/apple/validate`;

  const response = await fetch(url, {
    method: "POST",
    headers: await authHeaders(),
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const data = (await response.json().catch(() => ({}))) as { message?: string };
    throw new Error(data.message ?? "Purchase validation failed");
  }

  return (await response.json()) as ValidatePurchaseResponse;
}

export async function restoreApplePurchases(input?: {
  productId?: string;
  signedTransaction?: string;
}): Promise<RestorePurchaseResponse> {
  const base = resolveApiBase();
  const url = `${base}/iap/apple/restore`;

  const response = await fetch(url, {
    method: "POST",
    headers: await authHeaders(),
    body: JSON.stringify(input ?? {}),
  });

  if (!response.ok) {
    const data = (await response.json().catch(() => ({}))) as { message?: string };
    throw new Error(data.message ?? "Restore failed");
  }

  return (await response.json()) as RestorePurchaseResponse;
}
