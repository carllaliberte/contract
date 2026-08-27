import { postGenerateScript } from "../../lib/api/generateScript";
import type { AgentPort, AgentRunContext } from "../types";

export const openaiAdapter: AgentPort = {
  id: "openai",
  kind: "copy",
  label: "Script",
  available: () => true,
  async run(ctx) {
    const input = ctx as AgentRunContext;
    const data = await postGenerateScript({
      ideaId: input.ideaId,
      title: input.title ?? input.prompt.slice(0, 80),
      description: input.description ?? input.prompt,
      platform: input.platform ?? "youtube",
      language: input.language,
      mode: input.existingScript ? "improve" : "generate",
      existingScript: input.existingScript,
      format: input.format ?? "short",
      styleContext: input.stylePrompt,
    });
    return { text: data.script, apply: "script" };
  },
};
