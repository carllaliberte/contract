/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_CONTRACT_ADDRESS?: string
  readonly VITE_RPC_URL?: string
  readonly VITE_WALLETCONNECT_PROJECT_ID?: string
  readonly VITE_BASE_PATH?: string
}

interface Window {
  ethereum?: unknown
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
