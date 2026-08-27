import { customAdapter, geminiAdapter, grokAdapter } from "./adapters/webhook";
import { openaiAdapter } from "./adapters/openai";
import { tallyAdapter } from "./adapters/tally";
import { web3Adapter } from "./adapters/web3";
import { register } from "./bus";
import { isAgentEnabled } from "./flags";
import type { AgentId, AgentPort } from "./types";

const CATALOG: Record<AgentId, AgentPort> = {
  tally: tallyAdapter,
  openai: openaiAdapter,
  grok: grokAdapter,
  gemini: geminiAdapter,
  custom: customAdapter,
  web3: web3Adapter,
};

let registered = false;

export function ensureAgentsRegistered(): void {
  if (registered) return;
  registered = true;
  (Object.keys(CATALOG) as AgentId[]).forEach((id) => {
    if (id === "web3") {
      register(CATALOG[id]);
      return;
    }
    if (isAgentEnabled(id)) {
      register(CATALOG[id]);
    }
  });
}

export function resetAgentRegistration(): void {
  registered = false;
}
