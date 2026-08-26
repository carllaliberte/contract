import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
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
};

const IdeasContext = createContext<IdeasContextValue | null>(null);

function loadIdeas(): Idea[] {
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

function saveIdeas(ideas: Idea[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ideas));
  } catch {
    // ignore quota errors
  }
}

function readLanguage(): "fr" | "en" {
  const saved = localStorage.getItem("cf-locale");
  return saved === "en" ? "en" : "fr";
}

export function IdeasProvider({ children }: { children: ReactNode }) {
  const [ideas, setIdeas] = useState<Idea[]>(() => loadIdeas());

  useEffect(() => {
    saveIdeas(ideas);
  }, [ideas]);

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
      const idea = ideas.find((i) => i.id === id);
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

      updateIdea(id, {
        script: data.script,
        status: idea.status === "idea" ? "script" : idea.status,
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
