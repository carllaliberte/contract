/** Parse Grok's JSON pack (script + titles + caption + hashtags + hooks). */

export type ScriptPackPayload = {
  script: string;
  titles: string[];
  description: string;
  hashtags: string[];
  hooks: string[];
};

function asStringArray(value: unknown, max: number): string[] {
  if (!Array.isArray(value)) return [];
  const out: string[] = [];
  for (const item of value) {
    if (typeof item !== "string") continue;
    const trimmed = item.trim();
    if (!trimmed) continue;
    out.push(trimmed);
    if (out.length >= max) break;
  }
  return out;
}

export function normalizeHashtag(tag: string): string {
  const t = tag.replace(/^#+/, "").trim().replace(/\s+/g, "");
  return t ? `#${t}` : "";
}

function extractJsonObject(raw: string): Record<string, unknown> | null {
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced?.[1]?.trim() ?? raw;
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  try {
    const parsed: unknown = JSON.parse(candidate.slice(start, end + 1));
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
  } catch {
    return null;
  }
  return null;
}

export function parseScriptPack(raw: string): ScriptPackPayload {
  const trimmed = raw.trim();
  const json = extractJsonObject(trimmed);
  const script =
    typeof json?.script === "string" ? json.script.trim() : "";
  if (script) {
    return {
      script,
      titles: asStringArray(json?.titles, 3),
      description:
        typeof json?.description === "string" ? json.description.trim() : "",
      hashtags: asStringArray(json?.hashtags, 12)
        .map(normalizeHashtag)
        .filter(Boolean),
      hooks: asStringArray(json?.hooks, 3),
    };
  }
  return {
    script: trimmed,
    titles: [],
    description: "",
    hashtags: [],
    hooks: [],
  };
}

export function isGrokNotConfiguredMessage(message: string): boolean {
  return /GROK_NOT_CONFIGURED|XAI_API_KEY|OPENAI_API_KEY/i.test(message);
}

export function grokNotConfiguredCode(message: string): string {
  return isGrokNotConfiguredMessage(message) ? "GROK_NOT_CONFIGURED" : message;
}
