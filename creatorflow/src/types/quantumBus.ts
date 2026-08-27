import type { ContentPackage } from "./aiContext";
import type { AgentCapability } from "./agentBus";
import type { ScriptGenerateOptions } from "../components/ScriptGenerateDialog";
import type { Idea } from "../data/demo";

/** Operational slots in Carl → Grok → Quantum flow. */
export type QuantumSlot =
  | "idees"
  | "studio"
  | "upload"
  | "native"
  | "cursor"
  | "operateur"
  | "musique"
  | "design"
  | "debug"
  | "conflit";

/** External rails (live = solid, ai/w3 = dormant or isolated). */
export type QuantumRail = "live" | "ai" | "w3";

export type QuantumEventKind =
  | "script.preview"
  | "script.apply"
  | "ideas.sync"
  | "tts.speak";

export type QuantumEvent =
  | {
      kind: "script.preview";
      slot: "idees";
      ideaId: string;
      options: ScriptGenerateOptions;
    }
  | {
      kind: "script.apply";
      slot: "idees";
      ideaId: string;
      pack: ContentPackage;
    }
  | {
      kind: "ideas.sync";
      slot: "idees";
      ideas: Idea[];
    }
  | {
      kind: "tts.speak";
      slot: "musique" | "studio";
      text: string;
      voiceId?: string;
      speed?: number;
    };

export type ScriptPreviewResult = {
  pack: ContentPackage;
  usage?: import("../lib/api/types").AiUsageSnapshot;
  model?: string;
  provider: import("./agentBus").AgentProvider;
};

export type QuantumRailMeta = {
  id: QuantumRail;
  status: "active" | "dormant" | "isolated";
  label: string;
};

export const QUANTUM_RAILS: QuantumRailMeta[] = [
  { id: "live", status: "active", label: "Rails live (GitHub, design, Gmail…)" },
  { id: "ai", status: "dormant", label: "Slots AI (Slack, Notion, Linear…)" },
  { id: "w3", status: "isolated", label: "Rail Web3 (META, WalletConnect)" },
];

export function slotForCapability(capability: AgentCapability): QuantumSlot {
  switch (capability) {
    case "script.generate":
    case "webhook.dispatch":
      return "idees";
    case "tts.speak":
      return "musique";
    case "web3.read":
      return "operateur";
    default:
      return "idees";
  }
}
