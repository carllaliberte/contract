import type { Idea } from "../../data/demo";
import { demoIdeas } from "../../data/demo";

const STORAGE_KEY = "cf-ideas";

export function loadLocalIdeas(): Idea[] {
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

export function saveLocalIdeas(ideas: Idea[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ideas));
  } catch {
    // ignore quota errors
  }
}

export function clearLocalIdeas() {
  localStorage.removeItem(STORAGE_KEY);
}
