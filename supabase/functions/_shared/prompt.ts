import type { Language, Platform, GenerateMode, PromptInput, ScriptFormat } from "./types.ts";

function buildLongChapteredStructure(
  durationMinutes: number,
  language: Language,
): string {
  if (language === "fr") {
    return [
      `Produis un script YouTube long format (~${durationMinutes} min) avec structure chapitrée :`,
      "CHAPITRE 0 — HOOK (10–15 s): promesse claire, pattern interrupt",
      "CHAPITRE 1 — CONTEXTE: pourquoi le sujet compte maintenant",
      "CHAPITRES 2–N — CORPS: sections numérotées (titre de chapitre + contenu oral)",
      "  - Chaque chapitre = 1 idée actionnable avec transition vers le suivant",
      "  - Indique [VISUEL] ou plan suggéré quand pertinent",
      "CHAPITRE FINAL — RÉCAP + CTA: synthèse en 3 points + abonnement + prochain épisode",
      "",
      "Contraintes :",
      `- Durée cible ~${durationMinutes} minutes à l'oral`,
      "- Style naturel FR-CA, zéro corporate",
      "- Pas de hashtags dans le script",
      "- Structure explicite avec titres CHAPITRE",
    ].join("\n");
  }

  return [
    `Produce a long-form YouTube script (~${durationMinutes} min) with a chaptered structure:`,
    "CHAPTER 0 — HOOK (10–15 s): clear promise, pattern interrupt",
    "CHAPTER 1 — CONTEXT: why this topic matters now",
    "CHAPTERS 2–N — BODY: numbered sections (chapter title + spoken content)",
    "  - Each chapter = one actionable idea with a transition to the next",
    "  - Add [VISUAL] or shot suggestions when helpful",
    "FINAL CHAPTER — RECAP + CTA: 3-point summary + subscribe + next episode",
    "",
    "Constraints:",
    `- Target spoken length ~${durationMinutes} minutes`,
    "- Natural, direct tone",
    "- No hashtags in the script",
    "- Explicit CHAPTER headings",
  ].join("\n");
}

function resolveFormat(input: { format?: ScriptFormat }): ScriptFormat {
  return input.format === "long" ? "long" : "short";
}

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
  instagram: {
    fr: "Format Instagram/Reels : vertical, 30–90 s, hook immédiat, rythme rapide, CTA discret (suivre, partager).",
    en: "Instagram/Reels format: vertical, 30–90 s, immediate hook, fast pace, subtle CTA (follow, share).",
  },
  x: {
    fr: "Format X (Twitter) : thread 6–12 posts, hook très fort sur le premier post, ton conversationnel thought-leadership, CTA clair en fin de thread. Alternative : post unique fort. Inclure 3–5 variantes de hooks et une version post unique condensée.",
    en: "X (Twitter) format: 6–12 post thread, very strong hook on the first post, conversational thought-leadership tone, clear CTA at the end. Alternative: strong single post. Include 3–5 hook variants and a condensed single-post version.",
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

const TIKTOK_FR_STRUCTURE = [
  "Produis :",
  "HOOK (0–3s): une phrase qui stoppe le scroll",
  "SCÈNE 1 (3–10s): setup",
  "SCÈNE 2 (10–25s): valeur / twist",
  "SCÈNE 3 (25–40s): preuve ou démo ultra courte",
  "CTA (dernières 5s): suivi ou commentaire",
  "",
  "Contraintes :",
  "- Total ~35–50 secondes à l’oral",
  "- Phrases courtes, oral, punchy",
  "- 1 idée max, pas de liste longue",
  "- Pas de « dans cette vidéo on va parler de… »",
].join("\n");

const REELS_FR_STRUCTURE = [
  "Produis :",
  "HOOK VISUEL + TEXTE (0–3s): ce qui s’affiche à l’écran + phrase dite",
  "DÉROULÉ: 3 à 5 beats (chaque beat = 1 plan / 1 phrase)",
  "TEXTE À L’ÉCRAN: suggestions de captions courtes par beat",
  "AUDIO: ambiance suggérée (voix off / trend / silence + texte)",
  "CTA: suivi ou sauvegarde",
  "",
  "Contraintes :",
  "- 20–40 secondes",
  "- Pensé vertical 9:16",
  "- Hook compréhensible sans le son",
].join("\n");

const X_FR_STRUCTURE = [
  "Produis un contenu X (Twitter) multi-format :",
  "",
  "=== THREAD PRINCIPAL (6–12 posts) ===",
  "POST 1 — HOOK : accroche très forte qui stoppe le scroll (max 280 car.)",
  "POSTS 2–N — CORPS : 1 idée par post, ton conversationnel thought-leadership, transitions fluides entre posts",
  "POST FINAL — CTA : appel à l'action clair (follow, répondre, RT, lien)",
  "",
  "=== ALTERNATIVE — POST UNIQUE FORT ===",
  "(Un post autonome percutant, max 280 caractères)",
  "",
  "=== VARIANTES DE HOOKS (3–5 options) ===",
  "1. ...",
  "2. ...",
  "3. ...",
  "",
  "=== VERSION POST UNIQUE CONDENSÉE ===",
  "(Résumé du thread en un seul post optimisé, max 280 car.)",
  "",
  "Contraintes :",
  "- Ton conversationnel, thought-leadership, zéro corporate",
  "- Chaque post ≤ 280 caractères (indique le nombre de caractères entre parenthèses)",
  "- Premier post = hook irrésistible, pattern interrupt",
  "- CTA explicite en fin de thread",
  "- Pas de hashtags forcés (1–2 max si pertinent)",
  "- Numérote chaque post du thread (1/N, 2/N, etc.)",
].join("\n");

const X_EN_STRUCTURE = [
  "Produce multi-format X (Twitter) content:",
  "",
  "=== MAIN THREAD (6–12 posts) ===",
  "POST 1 — HOOK: very strong scroll-stopping hook (max 280 chars)",
  "POSTS 2–N — BODY: one idea per post, conversational thought-leadership tone, smooth transitions",
  "FINAL POST — CTA: clear call to action (follow, reply, RT, link)",
  "",
  "=== ALTERNATIVE — STRONG SINGLE POST ===",
  "(One punchy standalone post, max 280 characters)",
  "",
  "=== HOOK VARIANTS (3–5 options) ===",
  "1. ...",
  "2. ...",
  "3. ...",
  "",
  "=== CONDENSED SINGLE-POST VERSION ===",
  "(Thread summary as one optimized post, max 280 chars)",
  "",
  "Constraints:",
  "- Conversational, thought-leadership tone, zero corporate speak",
  "- Each post ≤ 280 characters (show character count in parentheses)",
  "- First post = irresistible hook, pattern interrupt",
  "- Explicit CTA at end of thread",
  "- No forced hashtags (1–2 max if relevant)",
  "- Number each thread post (1/N, 2/N, etc.)",
].join("\n");

function buildImproveUserPrompt(
  platform: Platform,
  existingScript: string,
  language: Language,
): string {
  if (language === "fr") {
    return [
      `Améliore ce script pour ${platform}.`,
      "Garde la même structure, augmente le punch du hook et clarifie le CTA.",
      "Script actuel:",
      existingScript,
    ].join("\n");
  }

  return [
    `Improve this script for ${platform}.`,
    "Keep the same structure, increase the hook punch and clarify the CTA.",
    "Current script:",
    existingScript,
  ].join("\n");
}

function buildYouTubeFrPrompt(input: PromptInput): { system: string; user: string } {
  const system =
    "Tu es scénariste YouTube (FR-CA). Style naturel, direct, zéro corporate. Réponds uniquement avec le script structuré, sans méta-commentaire.";

  if (input.mode === "improve" && input.existingScript?.trim()) {
    return {
      system,
      user: buildImproveUserPrompt(
        input.platform,
        input.existingScript,
        input.language,
      ),
    };
  }

  const user = [
    `Titre: ${input.title}`,
    `Description: ${input.description}`,
    "",
    YOUTUBE_FR_STRUCTURE,
  ].join("\n");

  return { system, user };
}

function buildTikTokFrPrompt(input: PromptInput): { system: string; user: string } {
  const system =
    "Tu es scénariste TikTok / Shorts (FR-CA). Rythme rapide, pattern interrupt. Réponds uniquement avec le script structuré, sans méta-commentaire.";

  if (input.mode === "improve" && input.existingScript?.trim()) {
    return {
      system,
      user: buildImproveUserPrompt(
        input.platform,
        input.existingScript,
        input.language,
      ),
    };
  }

  const user = [
    `Titre: ${input.title}`,
    `Description: ${input.description}`,
    "",
    TIKTOK_FR_STRUCTURE,
  ].join("\n");

  return { system, user };
}

function buildReelsFrPrompt(input: PromptInput): { system: string; user: string } {
  const system =
    "Tu es scénariste Instagram Reels (FR-CA). Esthétique + clarté. Réponds uniquement avec le script structuré, sans méta-commentaire.";

  if (input.mode === "improve" && input.existingScript?.trim()) {
    return {
      system,
      user: buildImproveUserPrompt(
        input.platform,
        input.existingScript,
        input.language,
      ),
    };
  }

  const user = [
    `Titre: ${input.title}`,
    `Description: ${input.description}`,
    "",
    REELS_FR_STRUCTURE,
  ].join("\n");

  return { system, user };
}

function buildXPrompt(input: PromptInput): { system: string; user: string } {
  const isFr = input.language === "fr";
  const system = isFr
    ? "Tu es expert en contenu X (Twitter) et thought-leadership. Tu maîtrises les threads viraux, les hooks percutants et le ton conversationnel. Réponds uniquement avec le contenu structuré, sans méta-commentaire."
    : "You are an X (Twitter) content and thought-leadership expert. You master viral threads, punchy hooks, and conversational tone. Reply with only the structured content, no meta commentary.";

  if (input.mode === "improve" && input.existingScript?.trim()) {
    return {
      system,
      user: buildImproveUserPrompt(
        input.platform,
        input.existingScript,
        input.language,
      ),
    };
  }

  const structure = isFr ? X_FR_STRUCTURE : X_EN_STRUCTURE;
  const titleLabel = isFr ? "Titre" : "Title";
  const descLabel = isFr ? "Description" : "Description";

  const user = [
    `${titleLabel}: ${input.title}`,
    `${descLabel}: ${input.description}`,
    "",
    structure,
  ].join("\n");

  return { system, user };
}

export function buildScriptPrompt(input: PromptInput): {
  system: string;
  user: string;
} {
  const format = resolveFormat(input);

  if (input.platform === "x") {
    return buildXPrompt(input);
  }

  if (format === "long") {
    const duration = input.durationMinutes ?? 12;
    const structure = buildLongChapteredStructure(duration, input.language);
    const systemFr =
      "Tu es scénariste YouTube long format (FR-CA). Structure chapitrée type documentaire/creator. Réponds uniquement avec le script, sans méta-commentaire.";
    const systemEn =
      "You are a long-form YouTube scriptwriter. Chaptered creator/documentary style. Reply with only the script, no meta commentary.";
    const system = input.language === "fr" ? systemFr : systemEn;

    if (input.mode === "improve" && input.existingScript?.trim()) {
      return {
        system,
        user: buildImproveUserPrompt(
          input.platform,
          input.existingScript,
          input.language,
        ),
      };
    }

    const user = [
      `Titre: ${input.title}`,
      `Description: ${input.description}`,
      `Plateforme: ${input.platform}`,
      "",
      structure,
    ].join("\n");

    return { system, user };
  }

  if (input.platform === "youtube" && input.language === "fr") {
    return buildYouTubeFrPrompt(input);
  }

  if (input.platform === "tiktok" && input.language === "fr") {
    return buildTikTokFrPrompt(input);
  }

  if ((input.platform === "reels" || input.platform === "instagram") && input.language === "fr") {
    return buildReelsFrPrompt(input);
  }

  const lang = input.language;
  const platformLine = platformGuidance[input.platform][lang];

  const systemFr =
    "Tu es un scénariste expert pour créateurs de contenu. Produis un script prêt à tourner, avec indications visuelles [VISUEL] et dialogues clairs. Réponds uniquement avec le script, sans méta-commentaire.";
  const systemEn =
    "You are an expert scriptwriter for content creators. Produce a shoot-ready script with visual cues [VISUAL] and clear dialogue. Reply with only the script, no meta commentary.";

  const system = lang === "fr" ? systemFr : systemEn;

  if (input.mode === "improve" && input.existingScript?.trim()) {
    return {
      system,
      user: buildImproveUserPrompt(
        input.platform,
        input.existingScript,
        lang,
      ),
    };
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
