const SITE_ORIGIN = "https://carllaliberte.github.io/contract/creatorflow";
const ROBOTS_META = "robots";
const INDEX_ROBOTS = "index, follow";
const APP_ROBOTS = "noindex, nofollow";

export const SEO = {
  siteOrigin: SITE_ORIGIN,
  canonicalUrl: `${SITE_ORIGIN}/`,
  faviconPath: "/contract/creatorflow/favicon.svg",
} as const;

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
