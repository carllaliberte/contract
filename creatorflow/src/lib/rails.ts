import type { AgentCapability, AgentProvider } from "../types/agentBus";
import { DEFAULT_AGENT_ROUTING } from "../types/agentBus";
import type { QuantumRail } from "../types/quantumBus";
import { isNativeIos } from "./platform";

/** Web3 rail is web-only — hidden on iPhone (App Store 1.0). */
export function isWeb3RailAvailable(): boolean {
  return !isNativeIos();
}

export function isProviderAvailable(provider: AgentProvider): boolean {
  if (provider === "web3") return isWeb3RailAvailable();
  if (provider === "grok" || provider === "gemini" || provider === "custom") {
    return false;
  }
  return true;
}

export function resolveAgentProvider(
  capability: AgentCapability,
  override?: AgentProvider,
): AgentProvider | null {
  const candidate = override ?? DEFAULT_AGENT_ROUTING[capability];
  return isProviderAvailable(candidate) ? candidate : null;
}

export function isQuantumRailActive(rail: QuantumRail): boolean {
  if (rail === "w3") return isWeb3RailAvailable();
  if (rail === "ai") return false;
  return true;
}
