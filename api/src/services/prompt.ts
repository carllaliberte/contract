import type { Language, Platform, GenerateMode } from "../types.js";

const platformGuidance: Record<Platform, { fr: string; en: string }> = {
  youtube: {
    fr: "Format YouTube : hook percutant (10–15 s), structure claire avec sections numérotées, transitions, appel à l'action (like, commentaire, abonnement). Durée cible 8–12 minutes.",
    en: "YouTube format: strong hook (10–15 s), clear numbered sections, transitions, CTA (like, comment, subscribe). Target length 8–12 minutes.",
  },
  tiktok: {
    fr: "Format TikTok : ultra court et dynamique (15–60 s), pattern interrupt, texte oral punchy, trend-friendly. Pas de longue intro.",
    en: "TikTok format: ultra short and dynamic (15–60 s), pattern interrupt, punchy spoken lines, trend-friendly. No long intro.",
  },
  reels: {
    fr: "Format Reels/Instagram : vertical, 30–90 s, hook immédiat, rythme rapide, CTA discret (suivre, partager).",
    en: "Reels/Instagram format: vertical, 30–90 s, immediate hook, fast pace, subtle CTA (follow, share).",
  },
};

const YOUTUBE_FR_STRUCTURE = [
  "Produis un script structuré :",
  "HOOK: (première phrase, promesse claire, < 8 s)",
  "CONTEXTE: (pourquoi ça compte, 1–2 phrases)",
  "POINTS: (3 à 5 sections numérotées, chacune avec une idée actionnable)",
  "PREUVE / EXEMPLE: (concret)",
  "CTA: (abonnement + prochain sujet)",
  "",
  "Contraintes :",
  "- Langue française québécoise légère (pas joual forcé)",
  "- Pas de hashtags dans le script",
  "- Longueur adaptée à une vidéo 8–12 min (version condensée OK)",
].join("\n");

export type PromptInput = {
  title: string;
  description: string;
  platform: Platform;
  language: Language;
  mode: GenerateMode;
  existingScript?: string;
};

function buildYouTubeFrPrompt(input: PromptInput): { system: string; user: string } {
  const system =
    "Tu es scénariste YouTube (FR-CA). Style naturel, direct, zéro corporate. Réponds uniquement avec le script structuré, sans méta-commentaire.";

  if (input.mode === "improve" && input.existingScript?.trim()) {
    const user = [
      `Titre: ${input.title}`,
      `Description: ${input.description}`,
      "",
      "Améliore le script actuel en gardant la structure ci-dessous. Renforce le hook, la clarté et le ton FR-CA naturel.",
      "",
      YOUTUBE_FR_STRUCTURE,
      "",
      "Script actuel :",
      input.existingScript,
    ].join("\n");
    return { system, user };
  }

  const user = [
    `Titre: ${input.title}`,
    `Description: ${input.description}`,
    "",
    YOUTUBE_FR_STRUCTURE,
  ].join("\n");

  return { system, user };
}

export function buildScriptPrompt(input: PromptInput): {
  system: string;
  user: string;
} {
  if (input.platform === "youtube" && input.language === "fr") {
    return buildYouTubeFrPrompt(input);
  }

  const lang = input.language;
  const platformLine = platformGuidance[input.platform][lang];

  const systemFr =
    "Tu es un scénariste expert pour créateurs de contenu. Produis un script prêt à tourner, avec indications visuelles [VISUEL] et dialogues clairs. Réponds uniquement avec le script, sans méta-commentaire.";
  const systemEn =
    "You are an expert scriptwriter for content creators. Produce a shoot-ready script with visual cues [VISUAL] and clear dialogue. Reply with only the script, no meta commentary.";

  const system = lang === "fr" ? systemFr : systemEn;

  if (input.mode === "improve" && input.existingScript?.trim()) {
    const userFr = [
      `Améliore ce script pour ${input.platform}.`,
      platformLine,
      `Titre : ${input.title}`,
      `Description : ${input.description}`,
      "Script actuel :",
      input.existingScript,
    ].join("\n");
    const userEn = [
      `Improve this script for ${input.platform}.`,
      platformLine,
      `Title: ${input.title}`,
      `Description: ${input.description}`,
      "Current script:",
      input.existingScript,
    ].join("\n");
    return { system, user: lang === "fr" ? userFr : userEn };
  }

  const userFr = [
    `Écris un script complet pour ${input.platform}.`,
    platformLine,
    `Titre : ${input.title}`,
    `Description : ${input.description}`,
  ].join("\n");
  const userEn = [
    `Write a full script for ${input.platform}.`,
    platformLine,
    `Title: ${input.title}`,
    `Description: ${input.description}`,
  ].join("\n");

  return { system, user: lang === "fr" ? userFr : userEn };
}

export function buildMockScript(input: PromptInput): string {
  if (input.platform === "youtube" && input.language === "fr") {
    return [
      `HOOK: ${input.title} — voici ce que tu vas apprendre en moins de 8 secondes.`,
      "",
      `CONTEXTE: ${input.description}`,
      "",
      "POINTS:",
      "1. Première idée actionnable liée au sujet.",
      "2. Deuxième angle concret à appliquer tout de suite.",
      "3. Troisième conseil pour éviter les erreurs courantes.",
      "",
      "PREUVE / EXEMPLE: Un cas réel ou une anecdote courte qui illustre le point central.",
      "",
      "CTA: Si ça t'a aidé, abonne-toi — la semaine prochaine on creuse [prochain sujet].",
    ].join("\n");
  }

  const hook =
    input.language === "fr"
      ? `[VISUEL] Accroche rapide sur « ${input.title} »`
      : `[VISUAL] Quick hook on "${input.title}"`;
  const body =
    input.language === "fr"
      ? `${input.description}\n\n[POINT CLÉ] Développement adapté à ${input.platform}.`
      : `${input.description}\n\n[KEY POINT] Body tailored for ${input.platform}.`;
  const cta =
    input.language === "fr"
      ? "[CTA] Like, commentaire, abonnement — merci !"
      : "[CTA] Like, comment, subscribe — thanks!";
  return `${input.title}\n\n${hook}\n\n${body}\n\n${cta}`;
}
