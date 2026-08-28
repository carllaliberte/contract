import type { Idea } from "../../data/demo";
import { demoIdeas } from "../../data/demo";

const STORAGE_KEY = "cf-ideas";
const SEED_KEY = "cf-ideas-seed";
const SEED = "2026-08-27-thumb";

function hydrateDemoCovers(ideas: Idea[]): Idea[] {
  const seed = new Map(demoIdeas.map((demo) => [demo.id, demo]));
  return ideas.map((idea) => {
    const demo = seed.get(idea.id);
    if (!demo) return idea;
    return { ...idea, thumbnail: demo.thumbnail, title: demo.title, description: demo.description };
  });
}

export function loadLocalIdeas(): Idea[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(SEED_KEY, SEED);
      return structuredClone(demoIdeas);
    }
    const parsed = JSON.parse(raw) as Idea[];
    if (!Array.isArray(parsed) || parsed.length === 0) {
      localStorage.setItem(SEED_KEY, SEED);
      return structuredClone(demoIdeas);
    }
    if (localStorage.getItem(SEED_KEY) !== SEED) {
      const next = hydrateDemoCovers(parsed);
      localStorage.setItem(SEED_KEY, SEED);
      saveLocalIdeas(next);
      return next;
    }
    return parsed;
  } catch {
    return structuredClone(demoIdeas);
  }
}

export function saveLocalIdeas(ideas: Idea[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ideas));
  } catch {
    // ignore quota errors
  }
}

export function clearLocalIdeas() {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(SEED_KEY);
}
