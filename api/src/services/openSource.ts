/** Fetch and sanitize a public URL or pasted text for Grok script generation. */

export const MAX_SOURCE_CHARS = 8000;
const MAX_BYTES = 200_000;
const FETCH_MS = 8000;

export type OpenSourceInput = {
  url?: string;
  text?: string;
};

export type OpenSourceResult =
  | { context: string | undefined }
  | { error: string };

function isPrivateHostname(host: string): boolean {
  const h = host.replace(/^\[|\]$/g, "").toLowerCase();
  if (
    h === "localhost" ||
    h.endsWith(".localhost") ||
    h.endsWith(".local") ||
    h === "0.0.0.0" ||
    h === "::1"
  ) {
    return true;
  }
  if (h.startsWith("fe80:") || h.startsWith("fc") || h.startsWith("fd")) return true;
  const m = h.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (!m) return false;
  const a = Number(m[1]);
  const b = Number(m[2]);
  if (a === 10 || a === 127 || a === 0) return true;
  if (a === 192 && b === 168) return true;
  if (a === 169 && b === 254) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  return false;
}

export function parsePublicHttpUrl(raw: string): URL | null {
  let url: URL;
  try {
    url = new URL(raw.trim());
  } catch {
    return null;
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") return null;
  if (isPrivateHostname(url.hostname)) return null;
  return url;
}

export function htmlToText(html: string): string {
  const without = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&/g, "&")
    .replace(/</g, "<")
    .replace(/>/g, ">")
    .replace(/"/g, '"')
    .replace(/&#39;/g, "'");
  return without.replace(/\s+/g, " ").trim();
}

function clip(text: string): string {
  if (text.length <= MAX_SOURCE_CHARS) return text;
  return `${text.slice(0, MAX_SOURCE_CHARS)}…`;
}

async function fetchPublicPage(url: URL): Promise<string> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), FETCH_MS);
  try {
    const res = await fetch(url.toString(), {
      method: "GET",
      redirect: "follow",
      signal: ctrl.signal,
      headers: {
        Accept: "text/html,application/xhtml+xml,text/plain;q=0.9,*/*;q=0.8",
        "User-Agent": "CreatorFlow/1.0 (open-source script fetch)",
      },
    });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    const buf = new Uint8Array(await res.arrayBuffer());
    const slice = buf.byteLength > MAX_BYTES ? buf.slice(0, MAX_BYTES) : buf;
    const raw = new TextDecoder("utf-8", { fatal: false }).decode(slice);
    const type = res.headers.get("content-type") ?? "";
    const text = type.includes("html") || /<html/i.test(raw) ? htmlToText(raw) : raw.trim();
    if (!text) throw new Error("empty");
    return clip(text);
  } finally {
    clearTimeout(timer);
  }
}

export async function resolveOpenSource(
  input: OpenSourceInput,
): Promise<OpenSourceResult> {
  const pasted = input.text?.trim() ?? "";
  const rawUrl = input.url?.trim() ?? "";
  if (!pasted && !rawUrl) return { context: undefined };

  const parts: string[] = [];

  if (rawUrl) {
    const url = parsePublicHttpUrl(rawUrl);
    if (!url) {
      return { error: "URL invalide ou non publique (http/https uniquement)" };
    }
    try {
      const page = await fetchPublicPage(url);
      parts.push(`URL: ${url.toString()}\n${page}`);
    } catch {
      return {
        error:
          "Impossible de lire cette URL. Colle le texte de la page dans le champ source.",
      };
    }
  }

  if (pasted) parts.push(pasted);

  const context = clip(parts.join("\n\n"));
  return { context: context || undefined };
}

export function appendOpenSource(
  userPrompt: string,
  sourceContext: string | undefined,
  language: "fr" | "en" = "fr",
): string {
  const trimmed = sourceContext?.trim();
  if (!trimmed) return userPrompt;
  const header =
    language === "en"
      ? "OPEN SOURCE (public material provided by the user — ground the script in it, do not copy verbatim, transform into spoken lines):"
      : "SOURCE OUVERTE (matériau public fourni par l’utilisateur — appuie le script dessus, ne copie pas mot à mot, transforme en oral):";
  return `${userPrompt}\n\n${header}\n---\n${trimmed}\n---`;
}
