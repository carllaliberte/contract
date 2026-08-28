function normalizeBasename(value: string): string {
  if (value === "/") return "/";
  return value.endsWith("/") ? value.slice(0, -1) : value;
}

const configuredBasename = import.meta.env.VITE_ROUTER_BASENAME;

/** GitHub Pages default; override with VITE_ROUTER_BASENAME=/ for native iOS builds. */
export const ROUTER_BASENAME =
  configuredBasename !== undefined && configuredBasename !== ""
    ? normalizeBasename(configuredBasename)
    : "/contract/clapshot";
