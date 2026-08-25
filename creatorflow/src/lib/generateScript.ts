import type { Idea } from "../data/demo";

function hookFor(idea: Idea): string {
  switch (idea.platform) {
    case "youtube":
      return `« ${idea.title} » — et ce que personne vous dit sur le sujet…`;
    case "tiktok":
      return `POV : ${idea.title} (tu vas vouloir sauvegarder ça).`;
    case "reels":
      return `Stop scroll : ${idea.title} en 60 secondes chrono.`;
    default:
      return idea.title;
  }
}

export function generateScript(idea: Idea): string {
  const hook = hookFor(idea);

  if (idea.platform === "youtube") {
    return [
      `HOOK: ${hook}`,
      `POINT 1 — Contexte: ${idea.description}`,
      "POINT 2 — Démonstration: montrer le processus étape par étape avec exemples concrets.",
      "POINT 3 — Résultat: ce que le viewer obtient immédiatement après avoir appliqué.",
      `CTA: Like + abonnement pour la suite sur « ${idea.title} ». Commentez votre question #1.`,
    ].join("\n\n");
  }

  return [
    `HOOK (0–3s): ${hook}`,
    `BEAT 1 — Tension: ${idea.description}`,
    "BEAT 2 — Révélation: la solution en une phrase mémorable.",
    "BEAT 3 — Proof: montre le résultat ou la réaction authentique.",
    `CTA: « ${idea.title.split(" ")[0]} » en commentaire pour le guide complet.`,
  ].join("\n\n");
}
