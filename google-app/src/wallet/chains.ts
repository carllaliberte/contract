import {
  arbitrum,
  base,
  mainnet,
  polygon,
  sepolia,
  type Chain,
} from '@wagmi/core/chains'

/** Live GitHub Pages URL — whitelist this origin in WalletConnect Cloud. */
export const WALLETCONNECT_APP_URL = 'https://carllaliberte.github.io/contract/'

export type ChainEntry = {
  /** viem / wagmi chain definition (id, name, native currency, …) */
  chain: Chain
  /**
   * Optional Vite env key for a custom JSON-RPC URL.
   * When unset or empty, wagmi uses viem's default public RPC via http().
   */
  rpcEnvKey?: 'VITE_RPC_URL'
  /** Fallback RPC when the env key is empty (contract reads + form prefill). */
  defaultRpcUrl?: string
}

/**
 * Single source of truth for supported EVM chains.
 * To add a chain: append one entry here — no other file needs refactoring.
 */
export const chainEntries = [
  { chain: mainnet, defaultRpcUrl: 'https://eth.llamarpc.com' },
  {
    chain: sepolia,
    rpcEnvKey: 'VITE_RPC_URL',
    defaultRpcUrl: 'https://ethereum-sepolia-rpc.publicnode.com',
  },
  { chain: polygon, defaultRpcUrl: 'https://polygon-rpc.com' },
  { chain: arbitrum, defaultRpcUrl: 'https://arb1.arbitrum.io/rpc' },
  { chain: base, defaultRpcUrl: 'https://mainnet.base.org' },
] as const satisfies readonly ChainEntry[]

export const supportedChains = chainEntries.map((entry) => entry.chain) as unknown as readonly [
  Chain,
  ...Chain[],
]

export type SupportedChain = (typeof supportedChains)[number]

export const defaultChain = supportedChains[0]

export function getChainEntry(chainId: number): ChainEntry | undefined {
  return chainEntries.find((entry) => entry.chain.id === chainId)
}

export function getChainById(chainId: number): SupportedChain | undefined {
  return supportedChains.find((chain) => chain.id === chainId)
}

export function isSupportedChainId(chainId: number | undefined): chainId is SupportedChain['id'] {
  return chainId !== undefined && supportedChains.some((chain) => chain.id === chainId)
}

export function getChainName(chainId: number): string {
  return getChainById(chainId)?.name ?? `Chain ${chainId}`
}

/** RPC URL for ethers contract reads; undefined → viem public default in wagmi transports. */
export function getChainRpcUrl(chainId: number): string | undefined {
  const entry = getChainEntry(chainId)
  if (!entry) return undefined

  if (entry.rpcEnvKey) {
    const fromEnv = import.meta.env[entry.rpcEnvKey]?.trim()
    if (fromEnv) return fromEnv
  }

  return entry.defaultRpcUrl
}

export function getWalletConnectMetadata(origin?: string) {
  const base = origin ?? WALLETCONNECT_APP_URL
  const iconBase = origin ?? WALLETCONNECT_APP_URL

  return {
    name: 'META Token Dashboard',
    description: 'Non-custodial read-only dashboard for the META ERC-20 contract',
    url: base,
    icons: [`${iconBase.replace(/\/$/, '')}/favicon.svg`],
  }
}
