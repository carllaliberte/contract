import { isWeb3Enabled } from "../flags";
import type { AgentPort } from "../types";

/**
 * Future connector, web only.
 * No wallet, no RPC, no token, no contract address in the UI.
 */
export const web3Adapter: AgentPort = {
  id: "web3",
  kind: "web3",
  label: "Web",
  available: () => isWeb3Enabled(),
  async run() {
    return {
      text: "Connecteur Web — bientôt. Rien à appliquer pour cette idée.",
      apply: "pack",
    };
  },
};
