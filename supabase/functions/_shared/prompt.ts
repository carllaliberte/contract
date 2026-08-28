import { appendOpenSource } from "./openSource.ts";
import type { Language, Platform, GenerateMode, PromptInput, ScriptFormat } from "./types.ts";

function appendStyleContext(base: string, styleContext?: string): string {
  const trimmed = styleContext?.trim();
  if (!trimmed) return base;
  return `${base}\n\n${trimmed}`;
}

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
    fr: "Format X : un post unique ≤280 car., hook en première ligne, une idée, CTA répondre. Pas de thread. #Clapshot.",
    en: "X format: one post ≤280 chars, hook on line 1, one idea, reply CTA. No thread. #Clapshot.",
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
  "Produis UN post X. Pas de thread.",
  "",
  "POST (≤280 caractères, prêt à coller dans X) :",
  "Ligne 1 — HOOK : arrête le scroll.",
  "Ligne 2 — IDÉE : une seule, concrète.",
  "Ligne 3 — CTA : « Réponds » ou « Bookmark ». Pas « like and subscribe ».",
  "",
  "HOOKS — 3 variantes de la ligne 1",
  "",
  "Contraintes :",
  "- Oral FR-CA, zéro corporate, zéro emoji",
  "- 1 idée. Point.",
  "- script = le post. description = le même post.",
  "- Hashtags : #Clapshot + 1 max, pas dans le script",
  "- Thread seulement si l’utilisateur le demande",
].join("\n");

const X_EN_STRUCTURE = [
  "Write ONE X post. No thread.",
  "",
  "POST (≤280 characters, ready to paste on X):",
  "Line 1 — HOOK: stop the scroll.",
  "Line 2 — IDEA: one concrete point.",
  "Line 3 — CTA: “Reply” or “Bookmark”. Not “like and subscribe”.",
  "",
  "HOOKS — 3 variants of line 1",
  "",
  "Constraints:",
  "- Spoken, direct, zero corporate, zero emoji",
  "- One idea. Period.",
  "- script = the post. description = the same post.",
  "- Hashtags: #Clapshot + 1 max, not inside the script",
  "- Thread only if the user asks",
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
    ? "Tu écris des posts X. Un post, 280 caractères max, hook en première ligne. Pas de thread. Ton parlé FR-CA, zéro corporate. Réponds uniquement avec le contenu demandé."
    : "You write X posts. One post, 280 characters max, hook on line 1. No thread. Spoken, direct, zero corporate. Reply with only the requested content.";

  if (input.mode === "improve" && input.existingScript?.trim()) {
    return {
      system,
      user: isFr
        ? [
            "Réécris ce post X. Un seul post, ≤280 caractères, hook plus fort, CTA clair.",
            "Post actuel:",
            input.existingScript,
          ].join("\n")
        : [
            "Rewrite this X post. One post, ≤280 characters, stronger hook, clear CTA.",
            "Current post:",
            input.existingScript,
          ].join("\n"),
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

function appendPackInstruction(
  system: string,
  language: Language,
  platform: Platform,
): string {
  if (platform === "x") {
    if (language === "en") {
      return `${system}

PACK OUTPUT — reply with a single JSON object only (no markdown fences, no extra text):
{"script":"<the X post, max 280 chars>","titles":["hook 1","hook 2","hook 3"],"description":"<same post, ready to tweet>","hashtags":["#Clapshot"],"hooks":["hook 1","hook 2","hook 3"]}
- script: ONE X post, ready to paste, ≤280 characters, no thread
- titles: exactly 3 first-line hooks
- description: identical to script
- hashtags: #Clapshot plus at most one topical tag
- hooks: exactly 3 opening lines (not the full post)`;
    }
    return `${system}

SORTIE PACK — réponds UNIQUEMENT avec un objet JSON (pas de fences markdown, pas de texte autour) :
{"script":"<le post X, max 280 car.>","titles":["hook 1","hook 2","hook 3"],"description":"<le même post, prêt à tweeter>","hashtags":["#Clapshot"],"hooks":["accroche 1","accroche 2","accroche 3"]}
- script : UN post X prêt à coller, ≤280 caractères, pas de thread
- titles : exactement 3 variantes de la première ligne
- description : identique au script
- hashtags : #Clapshot et au plus un tag
- hooks : exactement 3 premières lignes (pas le post entier)`;
  }
  if (language === "en") {
    return `${system}

PACK OUTPUT — reply with a single JSON object only (no markdown fences, no extra text):
{"script":"<full spoken script with the requested structure>","titles":["title 1","title 2","title 3"],"description":"<social caption 1-2 sentences>","hashtags":["#tag1","#tag2","#tag3"],"hooks":["hook 1","hook 2","hook 3"]}
- script: the complete shoot-ready script (the only spoken content)
- titles: exactly 3 title variants
- description: caption for the post
- hashtags: 3 to 8 relevant tags
- hooks: exactly 3 alternate opening lines (not the full script)`;
  }
  return `${system}

SORTIE PACK — réponds UNIQUEMENT avec un objet JSON (pas de fences markdown, pas de texte autour) :
{"script":"<script oral complet avec la structure demandée>","titles":["titre 1","titre 2","titre 3"],"description":"<légende 1-2 phrases>","hashtags":["#tag1","#tag2","#tag3"],"hooks":["accroche 1","accroche 2","accroche 3"]}
- script : le script tourné complet (seul contenu oral)
- titles : exactement 3 variantes de titre
- description : légende du post
- hashtags : 3 à 8 tags pertinents
- hooks : exactement 3 accroches d'ouverture alternatives (pas le script entier)`;
}

export function buildScriptPrompt(input: PromptInput): {
  system: string;
  user: string;
} {
  const prompt = buildScriptPromptCore(input);
  return {
    system: appendPackInstruction(
      appendStyleContext(prompt.system, input.styleContext),
      input.language,
      input.platform,
    ),
    user: appendOpenSource(prompt.user, input.sourceContext, input.language),
  };
}

function buildScriptPromptCore(input: PromptInput): {
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
