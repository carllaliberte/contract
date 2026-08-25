function normalizeBasename(value: string | undefined): string {
  if (!value || value === "/") return "/";
  return value.endsWith("/") ? value.slice(0, -1) : value;
}

export const ROUTER_BASENAME =
  normalizeBasename(import.meta.env.VITE_ROUTER_BASENAME) || "/contract/creatorflow";
