import { postGenerateScript } from "../lib/api/generateScript";
import type { GenerateScriptResponse } from "../lib/api/types";
import { resolveAgentProvider } from "../lib/rails";
import { aiContext } from "./aiContext";
import type { ContentPackage } from "../types/aiContext";
import {
  AGENT_PROVIDERS,
  DEFAULT_AGENT_ROUTING,
  type AgentCapability,
  type AgentProvider,
} from "../types/agentBus";
import type { Idea } from "../data/demo";
import type { ScriptGenerateOptions } from "../components/ScriptGenerateDialog";

export type ScriptGenerateInput = {
  idea: Idea;
  language: "fr" | "en";
  options: ScriptGenerateOptions;
};

export type ScriptGenerateOutput = {
  pack: ContentPackage;
  usage?: GenerateScriptResponse["usage"];
  model?: string;
  provider: AgentProvider;
};

function readLanguage(): "fr" | "en" {
  const saved = localStorage.getItem("cf-locale");
  return saved === "en" ? "en" : "fr";
}

export function resolveProviderFor(capability: AgentCapability): AgentProvider | null {
  return resolveAgentProvider(capability);
}

export function listActiveProviders(): AgentProvider[] {
  return AGENT_PROVIDERS.filter((meta) => meta.status === "active").map((m) => m.id);
}

/**
 * AgentBus — routes AI capabilities to providers.
 * AgentBus — Grok is master for scripts. Other LLM providers assist.
 */
export async function dispatchScriptGenerate(
  input: ScriptGenerateInput,
): Promise<ScriptGenerateOutput> {
  const provider = resolveProviderFor("script.generate");
  if (!provider) {
    throw new Error("PROVIDER_UNAVAILABLE");
  }

  const { idea, options } = input;
  const language = input.language ?? readLanguage();
  const mode = idea.script ? "improve" : "generate";
  const context = aiContext.getContext({
    platform: idea.platform,
    language,
    format: options.format,
  });

  switch (provider) {
    case "grok":
    case "openai": {
      const data = await postGenerateScript({
        ideaId: idea.id,
        title: idea.title,
        description: idea.description,
        platform: idea.platform,
        language,
        mode,
        existingScript: idea.script,
        format: options.format,
        durationMinutes: options.durationMinutes,
        styleContext: context.stylePrompt,
        sourceUrl: options.sourceUrl,
        sourceText: options.sourceText,
      });

      const pack: ContentPackage = {
        ideaId: idea.id,
        platform: idea.platform,
        language,
        format: options.format,
        script: data.script,
        titles: data.titles,
        description: data.description,
        hashtags: data.hashtags,
        hooks: data.hooks,
        source: "generated",
        createdAt: new Date().toISOString(),
      };

      return { pack, usage: data.usage, model: data.model, provider };
    }
    default:
      throw new Error(`PROVIDER_UNAVAILABLE:${provider}`);
  }
}

export function defaultTtsProvider(): AgentProvider {
  return DEFAULT_AGENT_ROUTING["tts.speak"];
}

export const agentBus = {
  resolveProviderFor,
  listActiveProviders,
  dispatchScriptGenerate,
  defaultTtsProvider,
};
