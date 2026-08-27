import type { AIContext } from "../types/aiContext";
import type { ScriptFormat } from "../lib/api/types";

export type AgentId = "tally" | "openai" | "grok" | "gemini" | "web3" | "custom";
export type AgentKind = "copy" | "coach" | "measure" | "web3";
export type AgentCost = "local" | "paid";
export type AgentApplyTarget = "script" | "pack";

export type AgentResult = {
  text: string;
  apply?: AgentApplyTarget;
  source?: AgentId;
};

/** Extra idea fields travel with AIContext — same brain, not a second one. */
export type AgentRunContext = AIContext & {
  ideaId: string;
  prompt: string;
  title?: string;
  description?: string;
  existingScript?: string;
  format?: ScriptFormat;
};

export interface AgentPort {
  id: AgentId;
  kind: AgentKind;
  label: string;
  cost: AgentCost;
  available(): boolean;
  run(ctx: AIContext & { ideaId: string; prompt: string }): Promise<AgentResult>;
}

export type QuantumRunOptions = {
  /** Button the human pressed. Paid agents of other kinds never fire. */
  kind?: AgentKind;
};

export const AGENT_TIMEOUT_MS = 12_000;

export const KIND_LABEL: Record<AgentKind, { fr: string; en: string }> = {
  coach: { fr: "Régie", en: "Desk" },
  copy: { fr: "Script", en: "Script" },
  measure: { fr: "Mesure", en: "Measure" },
  web3: { fr: "Web", en: "Web" },
};
