/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  readonly VITE_AUTH_APPLE_URL?: string;
  readonly VITE_AUTH_STUB?: string;
  readonly VITE_BASE_PATH?: string;
  readonly VITE_ROUTER_BASENAME?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
