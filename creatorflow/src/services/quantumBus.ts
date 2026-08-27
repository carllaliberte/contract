import { enqueueCloudOp } from "../lib/cloudQueue";
import { buildApplyPackPatch } from "../lib/applyPack";
import { agentBus } from "./agentBus";
import { aiContext } from "./aiContext";
import type { ContentPackage } from "../types/aiContext";
import type { QuantumEvent, ScriptPreviewResult } from "../types/quantumBus";
import type { Idea } from "../data/demo";
import type { ScriptGenerateOptions } from "../components/ScriptGenerateDialog";

export type QuantumHandlers = {
  getIdea: (id: string) => Idea | undefined;
  patchIdea: (id: string, patch: Partial<Idea>) => void;
  syncIdeas: (ideas: Idea[]) => Promise<void>;
  isOnline: () => boolean;
};

function readLanguage(): "fr" | "en" {
  const saved = localStorage.getItem("cf-locale");
  return saved === "en" ? "en" : "fr";
}

/**
 * QuantumBus — central orchestration layer (Carl → Grok → Q).
 * Delegates AI work to AgentBus and offline work to cloudQueue.
 */
export async function emitQuantumEvent(
  event: QuantumEvent,
  handlers: QuantumHandlers,
): Promise<ScriptPreviewResult | void> {
  switch (event.kind) {
    case "script.preview": {
      if (!handlers.isOnline()) {
        enqueueCloudOp({
          type: "generate-script",
          ideaId: event.ideaId,
          options: event.options,
        });
        return;
      }

      const idea = handlers.getIdea(event.ideaId);
      if (!idea) return;

      const result = await agentBus.dispatchScriptGenerate({
        idea,
        language: readLanguage(),
        options: event.options,
      });

      return {
        pack: result.pack,
        usage: result.usage,
        model: result.model,
        provider: result.provider,
      };
    }

    case "script.apply": {
      const idea = handlers.getIdea(event.ideaId);
      if (!idea) return;

      const patch = buildApplyPackPatch(idea, event.pack);
      handlers.patchIdea(event.ideaId, patch);

      aiContext.updateStyleFromPackage({
        ...event.pack,
        source: "accepted",
      });
      return;
    }

    case "ideas.sync": {
      if (!handlers.isOnline()) {
        enqueueCloudOp({ type: "ideas-sync", ideas: event.ideas });
        return;
      }
      await handlers.syncIdeas(event.ideas);
      return;
    }

    case "tts.speak":
      // TTS playback stays in ttsProvider; slot reserved for future AgentBus routing.
      return;
  }
}

export async function previewScript(
  ideaId: string,
  options: ScriptGenerateOptions,
  handlers: QuantumHandlers,
): Promise<ScriptPreviewResult | undefined> {
  const result = await emitQuantumEvent(
    { kind: "script.preview", slot: "idees", ideaId, options },
    handlers,
  );
  return result ?? undefined;
}

export async function applyContentPack(
  ideaId: string,
  pack: ContentPackage,
  handlers: QuantumHandlers,
): Promise<void> {
  await emitQuantumEvent(
    { kind: "script.apply", slot: "idees", ideaId, pack },
    handlers,
  );
}

export const quantumBus = {
  emit: emitQuantumEvent,
  previewScript,
  applyContentPack,
};
