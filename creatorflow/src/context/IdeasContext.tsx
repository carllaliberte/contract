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
import { isGenerateScriptError, postGenerateScript } from "../lib/api/generateScript";
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
import { isSupabaseConfigured } from "../lib/supabase/client";
import { aiContext } from "../services/aiContext";
import type { ScriptGenerateOptions } from "../components/ScriptGenerateDialog";

type PersistenceMode = "local" | "supabase";

type IdeasContextValue = {
  ideas: Idea[];
  addIdea: (partial: Omit<Idea, "id" | "updatedAt">) => void;
  updateIdea: (id: string, patch: Partial<Idea>) => void;
  moveIdea: (id: string, status: IdeaStatus) => void;
  deleteIdea: (id: string) => void;
  duplicateIdea: (id: string) => void;
  generateScript: (id: string, options?: ScriptGenerateOptions) => Promise<void>;
};

const IdeasContext = createContext<IdeasContextValue | null>(null);

function readLanguage(): "fr" | "en" {
  const saved = localStorage.getItem("cf-locale");
  return saved === "en" ? "en" : "fr";
}

export function IdeasProvider({ children }: { children: ReactNode }) {
  const [ideas, setIdeas] = useState<Idea[]>(() => loadLocalIdeas());
  const [persistenceMode, setPersistenceMode] = useState<PersistenceMode>("local");
  const supabaseUserIdRef = useRef<string | null>(null);
  const hydratedRef = useRef(false);

  useEffect(() => {
    let cancelled = false;

    async function hydrate() {
      const session = await resolveSessionKind();
      if (cancelled) return;

      if (session === "apple" && isSupabaseConfigured()) {
        const profile = await getAppleProfile();
        if (cancelled) return;

        const userId = profile.userId;
        if (!userId) {
          setPersistenceMode("local");
          hydratedRef.current = true;
          return;
        }

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
        const hasCustomLocal =
          localStorage.getItem("cf-ideas") !== null &&
          localIdeas.some(
            (idea) => !demoIdeas.some((demo) => demo.id === idea.id),
          );

        if (hasCustomLocal) {
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

      setPersistenceMode("local");
      hydratedRef.current = true;
    }

    void hydrate();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!hydratedRef.current || persistenceMode !== "local") return;
    saveLocalIdeas(ideas);
  }, [ideas, persistenceMode]);

  const persistIdea = useCallback(
    async (idea: Idea) => {
      if (persistenceMode !== "supabase" || !supabaseUserIdRef.current) return;
      await upsertIdeaInSupabase(idea, supabaseUserIdRef.current);
    },
    [persistenceMode],
  );

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
      if (persistenceMode === "supabase") {
        void deleteIdeaInSupabase(id);
      }
    },
    [persistenceMode],
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

  const generateScript = useCallback(
    async (id: string, options: ScriptGenerateOptions = { format: "short" }) => {
      const idea = ideas.find((i) => i.id === id);
      if (!idea) return;

      if (!canUseAiGeneration(options.format)) {
        throw new Error("LIMIT_REACHED");
      }

      const language = readLanguage();
      const mode = idea.script ? "improve" : "generate";
      const context = aiContext.getContext({
        platform: idea.platform,
        language,
        format: options.format,
      });

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
      });

      if (data.usage) syncAiUsage(data.usage);

      updateIdea(id, {
        script: data.script,
        status: idea.status === "idea" ? "script" : idea.status,
      });

      aiContext.updateStyleFromPackage({
        ideaId: idea.id,
        platform: idea.platform,
        language,
        format: options.format,
        script: data.script,
        source: "generated",
      });
    },
    [ideas, updateIdea],
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
    }),
    [ideas, addIdea, updateIdea, moveIdea, deleteIdea, duplicateIdea, generateScript],
  );

  return <IdeasContext.Provider value={value}>{children}</IdeasContext.Provider>;
}

export function useIdeas(): IdeasContextValue {
  const ctx = useContext(IdeasContext);
  if (!ctx) throw new Error("useIdeas must be used within IdeasProvider");
  return ctx;
}

export { isGenerateScriptError };
