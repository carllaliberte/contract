import { useCallback, useEffect, useState } from "react";
import type { AIContext, AIContextOptions } from "../types/aiContext";
import { aiContext } from "../services/aiContext";

export function useAIContext(options: AIContextOptions = {}): AIContext {
  const [context, setContext] = useState<AIContext>(() => aiContext.getContext(options));

  const refresh = useCallback(() => {
    setContext(aiContext.getContext(options));
  }, [options.platform, options.language, options.format, options.includeMemory, options.memoryLimit]);

  useEffect(() => {
    refresh();
    return aiContext.subscribeStyleProfile(refresh);
  }, [refresh]);

  return context;
}

export function useStyleProfile() {
  const [profile, setProfile] = useState(() => aiContext.getStyleProfile());

  useEffect(() => {
    const refresh = () => setProfile(aiContext.getStyleProfile());
    refresh();
    return aiContext.subscribeStyleProfile(refresh);
  }, []);

  return profile;
}
