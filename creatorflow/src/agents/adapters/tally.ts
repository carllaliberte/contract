import type { StyleTone } from "../../types/aiContext";
import type { AgentPort, AgentRunContext } from "../types";

type TallyVoice = "collegue" | "realisateur" | "coach";

function pickVoice(tone: StyleTone): TallyVoice {
  if (tone === "educational" || tone === "inspirational") return "coach";
  if (tone === "direct") return "realisateur";
  return "collegue";
}

function tallyText(ctx: AgentRunContext): string {
  const voice = pickVoice(ctx.profile.tone);
  const lang = ctx.language;
  const prompt = ctx.prompt.trim() || ctx.title?.trim() || "";
  const hook = ctx.memoryExcerpts[0] ?? "";
  const clip = prompt.slice(0, 140);

  if (lang === "en") {
    if (voice === "coach") {
      return [
        "One next action: write the hook, then shoot.",
        clip ? `Stay on: ${clip}` : "Stay on this idea — one shot, one CTA.",
        hook ? `Your hook pattern: ${hook}` : "Open on a 3-second interrupt.",
        "Don't open another tab. Apply this and film.",
      ].join("\n");
    }
    if (voice === "realisateur") {
      return [
        "Shot 1: face, 3 s, the problem.",
        clip ? `Line: ${clip}` : "Say the result before the method.",
        "Shot 2: the proof. Shot 3: CTA, look at lens.",
        "Cut. That's the video.",
      ].join("\n");
    }
    return [
      "Keep it tight — you already know the angle.",
      clip ? `Start here: ${clip}` : "Start with the thing that made you open the app.",
      "One beat, one ask. Apply and move.",
    ].join("\n");
  }

  if (voice === "coach") {
    return [
      "Une prochaine action : écris le hook, puis tourne.",
      clip ? `Reste sur : ${clip}` : "Reste sur cette idée — un plan, un CTA.",
      hook ? `Ton hook habituel : ${hook}` : "Ouvre sur une interruption de 3 s.",
      "N'ouvre pas un autre onglet. Applique, et filme.",
    ].join("\n");
  }
  if (voice === "realisateur") {
    return [
      "Plan 1 : visage, 3 s, le problème.",
      clip ? `Réplique : ${clip}` : "Dis le résultat avant la méthode.",
      "Plan 2 : la preuve. Plan 3 : CTA, regard caméra.",
      "Coupe. C'est la vidéo.",
    ].join("\n");
  }
  return [
    "Serre-le — tu as déjà l'angle.",
    clip ? `Pars d'ici : ${clip}` : "Pars de ce qui t'a fait ouvrir l'app.",
    "Un temps, une demande. Applique et avance.",
  ].join("\n");
}

export const tallyAdapter: AgentPort = {
  id: "tally",
  kind: "coach",
  label: "Régie",
  available: () => true,
  async run(ctx) {
    return { text: tallyText(ctx as AgentRunContext), apply: "script" };
  },
};
