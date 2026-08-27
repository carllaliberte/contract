import { useState } from "react";
import type { Idea } from "../data/demo";
import { useIdeas, isGenerateScriptError } from "../context/IdeasContext";
import { isGrokNotConfiguredError } from "../lib/api/generateScript";
import { useI18n } from "../i18n/context";
import { canUseAiGeneration, syncAiUsage } from "../lib/aiUsage";
import type { ScriptFormat } from "../lib/plans";
import type { ScriptGenerateOptions } from "../components/ScriptGenerateDialog";
import { AGENT_PROVIDERS } from "../types/agentBus";
import type { ContentPackage } from "../types/aiContext";
import type { AgentProvider } from "../types/agentBus";

type PackPreviewState = {
  idea: Idea;
  pack: ContentPackage;
  provider?: AgentProvider;
};

export function useScriptPackFlow() {
  const { tr } = useI18n();
  const { previewScript, applyPack } = useIdeas();
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [packPreview, setPackPreview] = useState<PackPreviewState | null>(null);
  const [isApplying, setIsApplying] = useState(false);

  function providerLabel(provider?: AgentProvider): string | undefined {
    if (!provider) return undefined;
    return AGENT_PROVIDERS.find((p) => p.id === provider)?.label ?? provider;
  }

  async function submitPreview(idea: Idea, options: ScriptGenerateOptions) {
    if (!canUseAiGeneration(options.format)) {
      throw new Error("LIMIT_REACHED");
    }
    setGeneratingId(idea.id);
    setNotice(null);
    try {
      const result = await previewScript(idea.id, options);
      if (result) {
        setPackPreview({ idea, pack: result.pack, provider: result.provider });
      } else {
        setNotice(tr("pack.queuedOffline"));
      }
    } catch (error) {
      if (error instanceof Error && error.message === "LIMIT_REACHED") {
        throw error;
      }
      if (isGenerateScriptError(error) && error.error === "LIMIT_REACHED") {
        if (error.usage) syncAiUsage(error.usage);
        throw error;
      }
      if (isGenerateScriptError(error)) {
        setNotice(
          isGrokNotConfiguredError(error)
            ? tr("script.grokNotConfigured")
            : error.message,
        );
      } else {
        setNotice(tr("script.apiError"));
      }
    } finally {
      setGeneratingId(null);
    }
  }

  async function confirmApply(idea: Idea, pack: ContentPackage) {
    setIsApplying(true);
    try {
      await applyPack(idea.id, pack);
      setPackPreview(null);
    } finally {
      setIsApplying(false);
    }
  }

  function discardPreview() {
    setPackPreview(null);
  }

  return {
    generatingId,
    notice,
    setNotice,
    packPreview,
    isApplying,
    providerLabel: providerLabel(packPreview?.provider),
    submitPreview,
    confirmApply,
    discardPreview,
  };
}

export type ScriptPackFlowPaywallHandler = (format: ScriptFormat) => void;

export async function runScriptPreviewWithPaywall(
  idea: Idea,
  options: ScriptGenerateOptions,
  submitPreview: (idea: Idea, options: ScriptGenerateOptions) => Promise<void>,
  onPaywall: ScriptPackFlowPaywallHandler,
): Promise<void> {
  if (!canUseAiGeneration(options.format)) {
    onPaywall(options.format);
    return;
  }
  try {
    await submitPreview(idea, options);
  } catch (error) {
    if (error instanceof Error && error.message === "LIMIT_REACHED") {
      onPaywall(options.format);
    } else {
      throw error;
    }
  }
}
