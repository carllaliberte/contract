import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { demoIdeas, type Idea, type IdeaStatus } from "../data/demo";

const STORAGE_KEY = "cf-ideas";

function loadIdeas(): Idea[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return demoIdeas;
    const parsed = JSON.parse(raw) as Idea[];
    if (Array.isArray(parsed) && parsed.length > 0) return parsed;
  } catch {
    /* ignore corrupt storage */
  }
  return demoIdeas;
}

type NewIdeaInput = Omit<Idea, "id" | "updatedAt"> &
  Partial<Pick<Idea, "id" | "updatedAt">>;

type IdeasContextValue = {
  ideas: Idea[];
  addIdea: (input: NewIdeaInput) => void;
  updateIdea: (id: string, patch: Partial<Idea>) => void;
  moveIdea: (id: string, newStatus: IdeaStatus) => void;
  deleteIdea: (id: string) => void;
};

const IdeasContext = createContext<IdeasContextValue | null>(null);

export function IdeasProvider({ children }: { children: ReactNode }) {
  const [ideas, setIdeas] = useState<Idea[]>(loadIdeas);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ideas));
  }, [ideas]);

  const addIdea = useCallback((input: NewIdeaInput) => {
    const idea: Idea = {
      ...input,
      id: input.id ?? crypto.randomUUID(),
      updatedAt: input.updatedAt ?? new Date().toISOString(),
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
    (id: string, newStatus: IdeaStatus) => {
      updateIdea(id, { status: newStatus });
    },
    [updateIdea],
  );

  const deleteIdea = useCallback((id: string) => {
    setIdeas((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const value = useMemo(
    () => ({ ideas, addIdea, updateIdea, moveIdea, deleteIdea }),
    [ideas, addIdea, updateIdea, moveIdea, deleteIdea],
  );

  return <IdeasContext.Provider value={value}>{children}</IdeasContext.Provider>;
}

export function useIdeas(): IdeasContextValue {
  const ctx = useContext(IdeasContext);
  if (!ctx) throw new Error("useIdeas must be used within IdeasProvider");
  return ctx;
}
