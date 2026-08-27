import { isNativePlatform } from "../lib/platform";
import type { AgentId } from "./types";

const ALL_IDS: AgentId[] = ["tally", "openai", "grok", "gemini", "web3", "custom"];
const DEFAULT_AGENTS: AgentId[] = ["tally", "openai"];

export function parseAgentIds(raw: string | undefined): AgentId[] {
  const source = raw?.trim() ? raw : DEFAULT_AGENTS.join(",");
  const seen = new Set<AgentId>();
  const ids: AgentId[] = [];
  for (const part of source.split(",")) {
    const id = part.trim().toLowerCase() as AgentId;
    if (!ALL_IDS.includes(id) || seen.has(id)) continue;
    seen.add(id);
    ids.push(id);
  }
  return ids.length > 0 ? ids : [...DEFAULT_AGENTS];
}

export function enabledAgentIds(): AgentId[] {
  return parseAgentIds(import.meta.env.VITE_AGENTS);
}

export function isAgentEnabled(id: AgentId): boolean {
  return enabledAgentIds().includes(id);
}

/** Forced false on native — never surface Web3 / wallet on iOS. */
export function isWeb3Enabled(): boolean {
  if (isNativePlatform()) return false;
  return import.meta.env.VITE_AGENT_WEB3 === "true";
}

export function agentWebhookUrl(): string | undefined {
  const url = import.meta.env.VITE_AGENT_WEBHOOK?.trim();
  return url || undefined;
}
