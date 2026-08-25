const SITE_ORIGIN = "https://carllaliberte.github.io/contract/creatorflow";
const ROBOTS_META = "robots";
const INDEX_ROBOTS = "index, follow";
const APP_ROBOTS = "noindex, nofollow";
const FAQ_SCRIPT_ID = "cf-faq-jsonld";

export const SEO = {
  siteOrigin: SITE_ORIGIN,
  canonicalUrl: `${SITE_ORIGIN}/`,
  faviconPath: "/contract/creatorflow/favicon.svg",
  manifestPath: "/contract/creatorflow/manifest.webmanifest",
} as const;

export type FaqItem = {
  question: string;
  answer: string;
};

function getRobotsMeta(): HTMLMetaElement {
  let meta = document.querySelector<HTMLMetaElement>(`meta[name="${ROBOTS_META}"]`);
  if (!meta) {
    meta = document.createElement("meta");
    meta.name = ROBOTS_META;
    document.head.appendChild(meta);
  }
  return meta;
}

export function setRobotsDirective(content: string) {
  getRobotsMeta().content = content;
}

export function applyAppRobots() {
  setRobotsDirective(APP_ROBOTS);
}

export function applyLandingRobots() {
  setRobotsDirective(INDEX_ROBOTS);
}

export function setFaqJsonLd(items: FaqItem[]) {
  const existing = document.getElementById(FAQ_SCRIPT_ID);
  if (existing) existing.remove();

  if (items.length === 0) return;

  const script = document.createElement("script");
  script.id = FAQ_SCRIPT_ID;
  script.type = "application/ld+json";
  script.textContent = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  });
  document.head.appendChild(script);
}

export function clearFaqJsonLd() {
  document.getElementById(FAQ_SCRIPT_ID)?.remove();
}
