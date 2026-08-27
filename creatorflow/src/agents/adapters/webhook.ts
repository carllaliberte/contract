import { agentWebhookUrl } from "../flags";
import type { AgentId, AgentKind, AgentPort, AgentResult, AgentRunContext } from "../types";

function createWebhookAdapter(id: AgentId, kind: AgentKind, label: string): AgentPort {
  return {
    id,
    kind,
    label,
    available: () => Boolean(agentWebhookUrl()),
    async run(ctx) {
      const url = agentWebhookUrl();
      if (!url) {
        throw new Error(`AGENT_DOWN:${id}`);
      }
      const input = ctx as AgentRunContext;
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          ideaId: input.ideaId,
          prompt: input.prompt,
          stylePrompt: input.stylePrompt,
          language: input.language,
          platform: input.platform,
        }),
      });
      if (!response.ok) {
        throw new Error(`AGENT_DOWN:${id}`);
      }
      const data = (await response.json()) as Partial<AgentResult>;
      const text = typeof data.text === "string" ? data.text.trim() : "";
      if (!text) {
        throw new Error(`AGENT_DOWN:${id}`);
      }
      const apply = data.apply === "pack" || data.apply === "script" ? data.apply : "script";
      return { text, apply };
    },
  };
}

export const grokAdapter = createWebhookAdapter("grok", "measure", "Mesure");
export const geminiAdapter = createWebhookAdapter("gemini", "measure", "Mesure");
export const customAdapter = createWebhookAdapter("custom", "copy", "Script");
