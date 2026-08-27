/** LLM / TTS / webhook providers routed by AgentBus. */
export type AgentProvider =
  | "tally"
  | "openai"
  | "grok"
  | "gemini"
  | "web3"
  | "custom";

/** Capabilities the bus can dispatch to a provider. */
export type AgentCapability =
  | "script.generate"
  | "tts.speak"
  | "web3.read"
  | "webhook.dispatch";

export type AgentProviderStatus = "active" | "planned" | "hidden";

export type AgentProviderMeta = {
  id: AgentProvider;
  status: AgentProviderStatus;
  /** Human label (FR). */
  label: string;
  capabilities: AgentCapability[];
};

export const AGENT_PROVIDERS: AgentProviderMeta[] = [
  {
    id: "tally",
    status: "active",
    label: "Tally — voix régie",
    capabilities: ["tts.speak"],
  },
  {
    id: "grok",
    status: "active",
    label: "Grok — scripts (master)",
    capabilities: ["script.generate"],
  },
  {
    id: "openai",
    status: "planned",
    label: "OpenAI — assistant",
    capabilities: ["script.generate", "tts.speak"],
  },
  { id: "gemini", status: "planned", label: "Gemini — assistant", capabilities: ["script.generate"] },
  {
    id: "web3",
    status: "planned",
    label: "Web3 — lecture META",
    capabilities: ["web3.read"],
  },
  {
    id: "custom",
    status: "planned",
    label: "Webhook custom",
    capabilities: ["webhook.dispatch"],
  },
];

export const DEFAULT_AGENT_ROUTING: Record<AgentCapability, AgentProvider> = {
  "script.generate": "grok",
  "tts.speak": "tally",
  "web3.read": "web3",
  "webhook.dispatch": "custom",
};
