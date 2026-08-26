import { useCallback, useEffect, useState } from "react";
import type { AIContext } from "../types/aiContext";
import {
  getContext,
  hydrateAiContext,
  resetStyleMemory,
  setUseStyleMemory,
  subscribeStyleMemory,
} from "../services/aiContext";

export function useAiContext() {
  const [context, setContext] = useState<AIContext | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const next = await getContext();
    setContext(next);
    setLoading(false);
    return next;
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      await hydrateAiContext();
      if (cancelled) return;
      await refresh();
    })();
    return subscribeStyleMemory(() => {
      void refresh();
    });
  }, [refresh]);

  const toggleStyleMemory = useCallback(async (enabled: boolean) => {
    const next = await setUseStyleMemory(enabled);
    setContext(next);
    return next;
  }, []);

  const resetMemory = useCallback(async () => {
    const next = await resetStyleMemory();
    setContext(next);
    return next;
  }, []);

  return {
    context,
    loading,
    refresh,
    toggleStyleMemory,
    resetMemory,
  };
}
