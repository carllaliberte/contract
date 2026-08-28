import type { Idea } from "../data/demo";
import type { ContentPackage } from "../types/aiContext";

function locale(): "fr" | "en" {
  return localStorage.getItem("cf-locale") === "en" ? "en" : "fr";
}

export function buildBoothPack(idea: Idea): ContentPackage {
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
