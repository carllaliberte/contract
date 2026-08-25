import type { Idea } from "../data/demo";

export function buildScriptLocally(idea: Idea): string {
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

export async function generateScriptLocally(idea: Idea): Promise<string> {
  await new Promise((resolve) => setTimeout(resolve, 480));
  return buildScriptLocally(idea);
}
