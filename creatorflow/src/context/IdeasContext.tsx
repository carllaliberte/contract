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
import { canUseAiGeneration, recordAiGeneration } from "../lib/aiUsage";

const STORAGE_KEY = "cf-ideas";

type IdeasContextValue = {
  ideas: Idea[];
  addIdea: (partial: Omit<Idea, "id" | "updatedAt">) => void;
  updateIdea: (id: string, patch: Partial<Idea>) => void;
  moveIdea: (id: string, status: IdeaStatus) => void;
  deleteIdea: (id: string) => void;
  generateScript: (id: string) => Promise<void>;
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

function buildScript(idea: Idea): string {
  const title = idea.title;
  if (idea.platform === "youtube") {
    return [
      `HOOK (0-8s)`,
      `« ${title} — et la plupart des gens se trompent. »`,
      ``,
      `POINT 1`,
      `Explique le problème principal lié à « ${title} ».`,
      ``,
      `POINT 2`,
      `Montre la solution concrète + un exemple visuel.`,
      ``,
      `POINT 3`,
      `Erreur fréquente à éviter + mini démonstration.`,
      ``,
      `CTA`,
      `« Abonne-toi si tu veux la version complète. »`,
    ].join("\n");
  }
  return [
    `HOOK (0-3s)`,
    `Texte à l'écran : « ${title} »`,
    `Voix : accroche ultra courte, ton direct.`,
    ``,
    `SCÈNE 1`,
    `Montre le problème en 1 plan rapide.`,
    ``,
    `SCÈNE 2`,
    `La solution en action (B-roll + voix off).`,
    ``,
    `SCÈNE 3`,
    `Résultat / avant-après.`,
    ``,
    `CTA final`,
    `« Suis pour la suite » + emoji fort.`,
  ].join("\n");
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

  const generateScript = useCallback(
    async (id: string) => {
      if (!canUseAiGeneration()) return;
      await new Promise((r) => setTimeout(r, 480));
      if (!recordAiGeneration()) return;
      const idea = ideas.find((i) => i.id === id);
      if (!idea) return;
      const script = buildScript(idea);
      updateIdea(id, {
        script,
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
      generateScript,
    }),
    [ideas, addIdea, updateIdea, moveIdea, deleteIdea, generateScript],
  );

  return <IdeasContext.Provider value={value}>{children}</IdeasContext.Provider>;
}

export function useIdeas(): IdeasContextValue {
  const ctx = useContext(IdeasContext);
  if (!ctx) throw new Error("useIdeas must be used within IdeasProvider");
  return ctx;
}
