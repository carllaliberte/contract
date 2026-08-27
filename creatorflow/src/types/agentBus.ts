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
    id: "openai",
    status: "active",
    label: "OpenAI — scripts",
    capabilities: ["script.generate", "tts.speak"],
  },
  { id: "grok", status: "planned", label: "Grok", capabilities: ["script.generate"] },
  { id: "gemini", status: "planned", label: "Gemini", capabilities: ["script.generate"] },
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
  "script.generate": "openai",
  "tts.speak": "tally",
  "web3.read": "web3",
  "webhook.dispatch": "custom",
};
