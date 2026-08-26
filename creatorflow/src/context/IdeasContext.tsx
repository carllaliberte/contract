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
import { useAuth } from "../hooks/useAuth";
import { useNetworkStatus } from "../hooks/useNetworkStatus";
import { isGenerateScriptError, postGenerateScript } from "../lib/api/generateScript";
import {
  fetchIdeasFromApi,
  syncIdeasToApi,
  type ApiIdea,
} from "../lib/api/ideas";
import { canUseAiGeneration, syncAiUsage } from "../lib/aiUsage";
import { buildDuplicateIdea } from "../lib/ideaActions";
import { drainCloudQueue, enqueueCloudOp } from "../lib/cloudQueue";
import type { ScriptGenerateOptions } from "../components/ScriptGenerateDialog";

const STORAGE_KEY = "cf-ideas";

type IdeasContextValue = {
  ideas: Idea[];
  addIdea: (partial: Omit<Idea, "id" | "updatedAt">) => void;
  updateIdea: (id: string, patch: Partial<Idea>) => void;
  moveIdea: (id: string, status: IdeaStatus) => void;
  deleteIdea: (id: string) => void;
  duplicateIdea: (id: string) => void;
  generateScript: (id: string, options?: ScriptGenerateOptions) => Promise<void>;
  isCloudBacked: boolean;
};

const IdeasContext = createContext<IdeasContextValue | null>(null);

function loadLocalIdeas(): Idea[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return structuredClone(demoIdeas);
    const parsed = JSON.parse(raw) as Idea[];
    if (!Array.isArray(parsed) || parsed.length === 0) {
      return structuredClone(demoIdeas);
    }
    return parsed;
  } catch {
    return structuredClone(demoIdeas);
  }
}

function saveLocalIdeas(ideas: Idea[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ideas));
  } catch {
    // ignore quota errors
  }
}

function ideaToApi(idea: Idea): ApiIdea {
  return {
    id: idea.id,
    title: idea.title,
    description: idea.description,
    status: idea.status,
    priority: idea.priority,
    platform: idea.platform,
    updatedAt: idea.updatedAt,
    script: idea.script,
    thumbnail: idea.thumbnail,
    videoUrl: idea.videoUrl,
    scheduledAt: idea.scheduledAt,
  };
}

function apiToIdea(row: ApiIdea): Idea {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    status: row.status as Idea["status"],
    priority: row.priority as Idea["priority"],
    platform: row.platform as Idea["platform"],
    updatedAt: row.updatedAt,
    script: row.script,
    thumbnail: row.thumbnail,
    videoUrl: row.videoUrl,
    scheduledAt: row.scheduledAt,
  };
}

function hasCustomLocalIdeas(ideas: Idea[]): boolean {
  if (ideas.length !== demoIdeas.length) return true;
  const demoIds = new Set(demoIdeas.map((i) => i.id));
  return ideas.some((idea) => !demoIds.has(idea.id));
}

function readLanguage(): "fr" | "en" {
  const saved = localStorage.getItem("cf-locale");
  return saved === "en" ? "en" : "fr";
}

export function IdeasProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const online = useNetworkStatus();
  const isCloudBacked = isAuthenticated;
  const [ideas, setIdeas] = useState<Idea[]>(() => loadLocalIdeas());
  const syncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hydratedCloudRef = useRef(false);
  const ideasRef = useRef(ideas);

  useEffect(() => {
    ideasRef.current = ideas;
  }, [ideas]);

  const runGenerateScript = useCallback(
    async (id: string, options: ScriptGenerateOptions = { format: "short" }) => {
      const idea = ideasRef.current.find((i) => i.id === id);
      if (!idea) return;

      if (!canUseAiGeneration(options.format)) {
        throw new Error("LIMIT_REACHED");
      }

      const mode = idea.script ? "improve" : "generate";
      const data = await postGenerateScript({
        ideaId: idea.id,
        title: idea.title,
        description: idea.description,
        platform: idea.platform,
        language: readLanguage(),
        mode,
        existingScript: idea.script,
        format: options.format,
        durationMinutes: options.durationMinutes,
      });

      if (data.usage) syncAiUsage(data.usage);

      setIdeas((prev) =>
        prev.map((item) =>
          item.id === id
            ? {
                ...item,
                script: data.script,
                status: item.status === "idea" ? "script" : item.status,
                updatedAt: new Date().toISOString(),
              }
            : item,
        ),
      );
    },
    [],
  );

  useEffect(() => {
    if (!online) return;
    void drainCloudQueue({
      onGenerateScript: runGenerateScript,
      onIdeasSync: async (queuedIdeas) => {
        await syncIdeasToApi(queuedIdeas.map(ideaToApi));
        setIdeas(queuedIdeas);
      },
    });
  }, [online, runGenerateScript]);

  useEffect(() => {
    if (!isCloudBacked || isLoading) return;
    if (hydratedCloudRef.current) return;
    hydratedCloudRef.current = true;

    void (async () => {
      try {
        const remote = await fetchIdeasFromApi();
        if (remote.length > 0) {
          setIdeas(remote.map(apiToIdea));
          return;
        }
        const local = loadLocalIdeas();
        if (hasCustomLocalIdeas(local)) {
          await syncIdeasToApi(local.map(ideaToApi));
        }
      } catch {
        // keep local ideas when API is unavailable
      }
    })();
  }, [isCloudBacked, isLoading]);

  useEffect(() => {
    if (!isCloudBacked) {
      saveLocalIdeas(ideas);
      return;
    }

    if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
    syncTimerRef.current = setTimeout(() => {
      if (!online) {
        enqueueCloudOp({ type: "ideas-sync", ideas });
        saveLocalIdeas(ideas);
        return;
      }
      void syncIdeasToApi(ideas.map(ideaToApi)).catch(() => {
        enqueueCloudOp({ type: "ideas-sync", ideas });
        saveLocalIdeas(ideas);
      });
    }, 400);
  }, [ideas, isCloudBacked, online]);

  const addIdea = useCallback((partial: Omit<Idea, "id" | "updatedAt">) => {
    const idea: Idea = {
      ...partial,
      id: crypto.randomUUID(),
      updatedAt: new Date().toISOString(),
    };
    setIdeas((prev) => [idea, ...prev]);
  }, []);

  const updateIdea = useCallback((id: string, patch: Partial<Idea>) => {
    setIdeas((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, ...patch, updatedAt: new Date().toISOString() }
          : item,
      ),
    );
  }, []);

  const moveIdea = useCallback(
    (id: string, status: IdeaStatus) => {
      updateIdea(id, { status });
    },
    [updateIdea],
  );

  const deleteIdea = useCallback((id: string) => {
    setIdeas((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const duplicateIdea = useCallback(
    (id: string) => {
      const source = ideas.find((item) => item.id === id);
      if (!source) return;
      const suffix = readLanguage() === "en" ? " (copy)" : " (copie)";
      addIdea(buildDuplicateIdea(source, suffix));
    },
    [ideas, addIdea],
  );

  const generateScript = useCallback(
    async (id: string, options: ScriptGenerateOptions = { format: "short" }) => {
      if (!online) {
        enqueueCloudOp({ type: "generate-script", ideaId: id, options });
        return;
      }
      await runGenerateScript(id, options);
    },
    [online, runGenerateScript],
  );

  const value = useMemo(
    () => ({
      ideas,
      addIdea,
      updateIdea,
      moveIdea,
      deleteIdea,
      duplicateIdea,
      generateScript,
      isCloudBacked,
    }),
    [
      ideas,
      addIdea,
      updateIdea,
      moveIdea,
      deleteIdea,
      duplicateIdea,
      generateScript,
      isCloudBacked,
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
