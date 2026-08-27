export type Locale = "fr" | "en";

export type Translations = Record<string, string>;

export const translations: Record<Locale, Translations> = {
  fr: {
    "app.name": "Clapshot",
    "app.heroTitle": "4 idées. 0 plan tourné.",
    "app.tagline": "Clapshot — le booth.",
    "app.lead":
      "Le booth. Pas un dashboard de plus. Structure tes idées, écris tes scripts, et filme.",
    "app.heroBadge": "Le booth · Démo gratuite",
    "login.start": "On commence.",
    "showcase.title": "Voyez Clapshot en action",
    "why.title": "Pourquoi Clapshot ?",
    "faq.q1": "Qu'est-ce que Clapshot ?",
    "faq.a1":
      "Clapshot est une application web pour créateurs : organisez vos idées vidéo, générez des scripts avec l'IA et suivez chaque contenu jusqu'à la publication.",
    "faq.q2": "Clapshot est-il gratuit ?",
    "cta.title": "Téléchargez Clapshot et publiez plus régulièrement.",
    "footer.rights": "© 2026 Clapshot. Tous droits réservés.",
    "settings.demoEmail": "demo@clapshot.app",
    "plan.proName": "Clapshot Pro",
    "paywall.badge": "Clapshot Pro",
    "paywall.nativeUnavailable": "Disponible sur l'App Store — les achats intégrés seront activés lorsque CreatorFlowStoreKit sera branché.",
    "lang.label": "Langue",
    "lang.fr": "Français",
    "lang.en": "English",
  },
  en: {
    "app.name": "Clapshot",
    "app.heroTitle": "4 ideas. 0 shots filmed.",
    "app.tagline": "Clapshot — the booth.",
    "app.lead":
      "The booth. Not another dashboard. Structure your ideas, write scripts, and film.",
    "app.heroBadge": "The booth · Free demo",
    "login.start": "Let’s go.",
    "showcase.title": "See Clapshot in action",
    "why.title": "Why Clapshot?",
    "faq.q1": "What is Clapshot?",
    "faq.a1":
      "Clapshot is a web app for creators: organize video ideas, generate AI scripts, and track each piece until you publish.",
    "faq.q2": "Is Clapshot free?",
    "cta.title": "Get Clapshot and publish more consistently.",
    "footer.rights": "© 2026 Clapshot. All rights reserved.",
    "settings.demoEmail": "demo@clapshot.app",
    "plan.proName": "Clapshot Pro",
    "paywall.badge": "Clapshot Pro",
    "paywall.nativeUnavailable": "Available on the App Store — in-app purchases will be enabled when CreatorFlowStoreKit is connected.",
    "lang.label": "Language",
    "lang.fr": "Français",
    "lang.en": "English",
  },
};

export function t(
  locale: Locale,
  key: string,
  vars?: Record<string, string>,
): string {
  let text = translations[locale][key] ?? translations.en[key] ?? key;
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      text = text.replace(`{${k}}`, v);
    }
  }
  return text;
}
