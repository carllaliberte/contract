import type { Idea } from "../data/demo";
import type { ContentPackage } from "../types/aiContext";

function locale(): "fr" | "en" {
  return localStorage.getItem("cf-locale") === "en" ? "en" : "fr";
}

function clipTweet(text: string): string {
  const trimmed = text.trim();
  if (trimmed.length <= 280) return trimmed;
  return `${trimmed.slice(0, 279).trimEnd()}…`;
}

function buildXBoothPack(idea: Idea): ContentPackage {
  const fr = locale() !== "en";
  const hook =
    idea.title.trim() ||
    (fr ? "T’as l’idée. Pas le post." : "You have the idea. Not the post.");
  const script = clipTweet(
    fr ? `${hook}\n\nUn script. Un post. Maintenant.` : `${hook}\n\nOne script. One post. Now.`,
  );
  return {
    ideaId: idea.id,
    platform: "x",
    language: fr ? "fr" : "en",
    format: "short",
    script,
    titles: [
      hook,
      fr ? "Un post. Maintenant." : "One post. Now.",
      fr ? "4 idées. 0 post." : "4 ideas. 0 posts.",
    ],
    description: script,
    hashtags: ["#Clapshot"],
    hooks: [
      hook,
      fr ? "T’as 4 idées. 0 post." : "4 ideas. 0 posts.",
      fr ? "Un script. Un post." : "One script. One post.",
    ],
    source: "generated",
    createdAt: new Date().toISOString(),
  };
}

export function buildBoothPack(idea: Idea): ContentPackage {
  if (idea.platform === "x") return buildXBoothPack(idea);

  const fr = locale() !== "en";
  const hook = fr ? "3 objets. C’est tout." : "3 objects. That’s it.";
  const script = fr
    ? [
        `HOOK (0–2 s) : « ${hook} »`,
        `Idée : ${idea.title}`,
        idea.description,
        "0–3 s : montre le départ.",
        "3–8 s : un geste, une image nette.",
        "8–12 s : recule. CTA : « Suis pour la suite. »",
      ].join("\n")
    : [
        `HOOK (0–2s): “${hook}”`,
        `Idea: ${idea.title}`,
        idea.description,
        "0–3s: show the start.",
        "3–8s: one clean move.",
        "8–12s: pull back. CTA: “Follow for the rest.”",
      ].join("\n");

  return {
    ideaId: idea.id,
    platform: idea.platform,
    language: fr ? "fr" : "en",
    format: "short",
    script,
    titles: [idea.title],
    description: fr
      ? `${idea.description} Suis pour le setup complet.`
      : `${idea.description} Follow for the full setup.`,
    hashtags: ["#setup", "#reel", "#clapshot"],
    hooks: [
      hook,
      fr ? `Regarde ça : ${idea.title}` : `Watch this: ${idea.title}`,
      fr ? "Douze secondes. Pas plus." : "Twelve seconds. That’s all.",
    ],
    source: "generated",
    createdAt: new Date().toISOString(),
  };
}
