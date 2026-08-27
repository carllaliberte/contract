import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  demoIdeas,
  type Idea,
  type IdeaStatus,
} from "../data/demo";
import { useNetworkStatus } from "../hooks/useNetworkStatus";
import {
  fetchIdeasFromApi,
  ideaFromApi,
  ideaToApi,
  isApiConfigured,
  syncIdeasToApi,
} from "../lib/api/ideas";
import { isGenerateScriptError } from "../lib/api/generateScript";
import { canUseAiGeneration, syncAiUsage } from "../lib/aiUsage";
import { buildDuplicateIdea } from "../lib/ideaActions";
import { getAppleProfile, resolveSessionKind } from "../lib/auth/session";
import {
  clearLocalIdeas,
  loadLocalIdeas,
  saveLocalIdeas,
} from "../lib/ideas/localStore";
import {
  deleteIdeaInSupabase,
  fetchIdeasFromSupabase,
  upsertIdeaInSupabase,
  upsertIdeasInSupabase,
} from "../lib/ideas/supabaseStore";
import { drainCloudQueue, enqueueCloudOp } from "../lib/cloudQueue";
import {
  resolvePersistenceMode,
  type PersistenceMode,
} from "../lib/persistence";
import { isSupabaseConfigured } from "../lib/supabase/client";
import { quantumBus } from "../services/quantumBus";
import type { ScriptPreviewResult } from "../types/quantumBus";
import type { ContentPackage } from "../types/aiContext";
import type { ScriptGenerateOptions } from "../components/ScriptGenerateDialog";

type IdeasContextValue = {
  ideas: Idea[];
  addIdea: (partial: Omit<Idea, "id" | "updatedAt">) => void;
  updateIdea: (id: string, patch: Partial<Idea>) => void;
  moveIdea: (id: string, status: IdeaStatus) => void;
  deleteIdea: (id: string) => void;
  duplicateIdea: (id: string) => void;
  /** Generate script preview via QuantumBus → AgentBus (does not persist). */
  previewScript: (
    id: string,
    options?: ScriptGenerateOptions,
  ) => Promise<ScriptPreviewResult | undefined>;
  /** Persist an accepted content pack (« J'applique »). */
  applyPack: (id: string, pack: ContentPackage) => Promise<void>;
  isCloudBacked: boolean;
};

const IdeasContext = createContext<IdeasContextValue | null>(null);

function readLanguage(): "fr" | "en" {
  const saved = localStorage.getItem("cf-locale");
  return saved === "en" ? "en" : "fr";
}

function hasCustomLocalIdeas(localIdeas: Idea[]): boolean {
  return (
    localStorage.getItem("cf-ideas") !== null &&
    localIdeas.some((idea) => !demoIdeas.some((demo) => demo.id === idea.id))
  );
}

export function IdeasProvider({ children }: { children: ReactNode }) {
  const online = useNetworkStatus();
  const [ideas, setIdeas] = useState<Idea[]>(() => loadLocalIdeas());
  const [persistenceMode, setPersistenceMode] = useState<PersistenceMode>("local");
  const supabaseUserIdRef = useRef<string | null>(null);
  const hydratedRef = useRef(false);
  const ideasRef = useRef(ideas);
  const persistenceModeRef = useRef<PersistenceMode>("local");

  useEffect(() => {
    ideasRef.current = ideas;
  }, [ideas]);

  useEffect(() => {
    persistenceModeRef.current = persistenceMode;
  }, [persistenceMode]);

  const persistIdeaRef = useRef<(idea: Idea) => Promise<void>>(async () => {});

  const quantumHandlers = useMemo(
    () => ({
      getIdea: (id: string) => ideasRef.current.find((i) => i.id === id),
      patchIdea: (id: string, patch: Partial<Idea>) => {
        setIdeas((prev) =>
          prev.map((item) => (item.id === id ? { ...item, ...patch } : item)),
        );
        queueMicrotask(() => {
          const updated = ideasRef.current.find((i) => i.id === id);
          if (updated) void persistIdeaRef.current(updated);
        });
      },
      syncIdeas: async (queuedIdeas: Idea[]) => {
        const mode = persistenceModeRef.current;
        if (mode === "supabase") {
          const userId = supabaseUserIdRef.current;
          if (!userId) return;
          await upsertIdeasInSupabase(queuedIdeas, userId);
        } else if (mode === "api") {
          await syncIdeasToApi(queuedIdeas.map(ideaToApi));
        }
        setIdeas(queuedIdeas);
      },
      isOnline: () => online,
    }),
    [online],
  );

  const runGenerateScriptAutoApply = useCallback(
    async (id: string, options: ScriptGenerateOptions = { format: "short" }) => {
      const idea = ideasRef.current.find((i) => i.id === id);
      if (!idea) return;

      if (!canUseAiGeneration(options.format)) {
        throw new Error("LIMIT_REACHED");
      }

      const preview = await quantumBus.previewScript(id, options, quantumHandlers);
      if (!preview) return;

      if (preview.usage) syncAiUsage(preview.usage);
      await quantumBus.applyContentPack(id, preview.pack, quantumHandlers);
    },
    [quantumHandlers],
  );

  useEffect(() => {
    if (!online || !hydratedRef.current) return;
    void drainCloudQueue({
      onGenerateScript: runGenerateScriptAutoApply,
      onIdeasSync: quantumHandlers.syncIdeas,
    });
  }, [online, persistenceMode, runGenerateScriptAutoApply, quantumHandlers]);

  useEffect(() => {
    let cancelled = false;

    async function hydrate() {
      const session = await resolveSessionKind();
      if (cancelled) return;

      let mode = resolvePersistenceMode({
        session,
        supabaseConfigured: isSupabaseConfigured(),
        apiConfigured: isApiConfigured(),
      });

      if (mode === "supabase") {
        const profile = await getAppleProfile();
        if (cancelled) return;

        const userId = profile.userId;
        if (!userId) {
          mode = isApiConfigured() ? "api" : "local";
        } else {
          supabaseUserIdRef.current = userId;
          setPersistenceMode("supabase");

          const remote = await fetchIdeasFromSupabase();
          if (cancelled) return;

          if (remote && remote.length > 0) {
            setIdeas(remote);
            hydratedRef.current = true;
            return;
          }

          const localIdeas = loadLocalIdeas();
          if (hasCustomLocalIdeas(localIdeas)) {
            await upsertIdeasInSupabase(localIdeas, userId);
            if (!cancelled) {
              clearLocalIdeas();
              setIdeas(localIdeas);
            }
          } else if (remote) {
            setIdeas(remote);
          }

          hydratedRef.current = true;
          return;
        }
      }

      if (mode === "api") {
        setPersistenceMode("api");
        try {
          const remote = (await fetchIdeasFromApi())
            .map(ideaFromApi)
            .filter((idea): idea is Idea => idea !== null);
          if (cancelled) return;

          if (remote.length > 0) {
            setIdeas(remote);
            hydratedRef.current = true;
            return;
          }

          const localIdeas = loadLocalIdeas();
          if (hasCustomLocalIdeas(localIdeas)) {
            await syncIdeasToApi(localIdeas.map(ideaToApi));
            if (!cancelled) setIdeas(localIdeas);
          } else {
            setIdeas([]);
          }
        } catch {
          // Keep the local cache when the API is unreachable.
        }
        hydratedRef.current = true;
        return;
      }

      setPersistenceMode("local");
      hydratedRef.current = true;
    }

    void hydrate();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!hydratedRef.current) return;

    saveLocalIdeas(ideas);

    if (persistenceMode === "local") return;

    if (!online) {
      enqueueCloudOp({ type: "ideas-sync", ideas });
      return;
    }

    if (persistenceMode === "api") {
      void syncIdeasToApi(ideas.map(ideaToApi)).catch(() => {
        enqueueCloudOp({ type: "ideas-sync", ideas });
      });
      return;
    }

    if (persistenceMode === "supabase" && supabaseUserIdRef.current) {
      void upsertIdeasInSupabase(ideas, supabaseUserIdRef.current).catch(() => {
        enqueueCloudOp({ type: "ideas-sync", ideas });
      });
    }
  }, [ideas, persistenceMode, online]);

  const persistIdea = useCallback(
    async (idea: Idea) => {
      if (persistenceMode !== "supabase" || !supabaseUserIdRef.current) return;
      if (!online) {
        enqueueCloudOp({ type: "ideas-sync", ideas: ideasRef.current });
        return;
      }
      await upsertIdeaInSupabase(idea, supabaseUserIdRef.current);
    },
    [persistenceMode, online],
  );

  useEffect(() => {
    persistIdeaRef.current = persistIdea;
  }, [persistIdea]);

  const addIdea = useCallback(
    (partial: Omit<Idea, "id" | "updatedAt">) => {
      const idea: Idea = {
        ...partial,
        id: crypto.randomUUID(),
        updatedAt: new Date().toISOString(),
      };
      setIdeas((prev) => [idea, ...prev]);
      void persistIdea(idea);
    },
    [persistIdea],
  );

  const updateIdea = useCallback(
    (id: string, patch: Partial<Idea>) => {
      setIdeas((prev) => {
        const next = prev.map((item) =>
          item.id === id
            ? { ...item, ...patch, updatedAt: new Date().toISOString() }
            : item,
        );
        const updated = next.find((item) => item.id === id);
        if (updated) void persistIdea(updated);
        return next;
      });
    },
    [persistIdea],
  );

  const moveIdea = useCallback(
    (id: string, status: IdeaStatus) => {
      updateIdea(id, { status });
    },
    [updateIdea],
  );

  const deleteIdea = useCallback(
    (id: string) => {
      setIdeas((prev) => prev.filter((item) => item.id !== id));
      if (persistenceMode === "supabase" && online) {
        void deleteIdeaInSupabase(id);
      }
    },
    [persistenceMode, online],
  );

  const duplicateIdea = useCallback(
    (id: string) => {
      const source = ideas.find((item) => item.id === id);
      if (!source) return;
      const suffix = readLanguage() === "en" ? " (copy)" : " (copie)";
      addIdea(buildDuplicateIdea(source, suffix));
    },
    [ideas, addIdea],
  );

  const previewScript = useCallback(
    async (id: string, options: ScriptGenerateOptions = { format: "short" }) => {
      if (!canUseAiGeneration(options.format)) {
        throw new Error("LIMIT_REACHED");
      }
      if (!online) {
        enqueueCloudOp({ type: "generate-script", ideaId: id, options });
        return undefined;
      }
      const result = await quantumBus.previewScript(id, options, quantumHandlers);
      if (result?.usage) syncAiUsage(result.usage);
      return result;
    },
    [online, quantumHandlers],
  );

  const applyPack = useCallback(
    async (id: string, pack: ContentPackage) => {
      await quantumBus.applyContentPack(id, pack, quantumHandlers);
    },
    [quantumHandlers],
  );

  const value = useMemo(
    () => ({
      ideas,
      addIdea,
      updateIdea,
      moveIdea,
      deleteIdea,
      duplicateIdea,
      previewScript,
      applyPack,
      isCloudBacked: persistenceMode !== "local",
    }),
    [
      ideas,
      addIdea,
      updateIdea,
      moveIdea,
      deleteIdea,
      duplicateIdea,
      previewScript,
      applyPack,
      persistenceMode,
    ],
  );

  return <IdeasContext.Provider value={value}>{children}</IdeasContext.Provider>;
}

export function useIdeas(): IdeasContextValue {
  const ctx = useContext(IdeasContext);
  if (!ctx) throw new Error("useIdeas must be used within IdeasProvider");
  return ctx;
}

export { isGenerateScriptError };
