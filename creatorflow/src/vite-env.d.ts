/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  readonly VITE_AUTH_APPLE_URL?: string;
  readonly VITE_AUTH_STUB?: string;
  readonly VITE_BASE_PATH?: string;
  readonly VITE_ROUTER_BASENAME?: string;
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
  readonly VITE_AGENTS?: string;
  readonly VITE_AGENT_WEB3?: string;
  readonly VITE_AGENT_WEBHOOK?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
