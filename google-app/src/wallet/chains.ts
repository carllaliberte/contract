import { mainnet, sepolia, type Chain } from '@wagmi/core/chains'

/** Supported chains — add entries here to extend network support. */
export const supportedChains = [sepolia, mainnet] as const satisfies readonly [Chain, ...Chain[]]

export type SupportedChain = (typeof supportedChains)[number]

export function getChainById(chainId: number): SupportedChain | undefined {
  return supportedChains.find((chain) => chain.id === chainId)
}

export function getChainName(chainId: number): string {
  return getChainById(chainId)?.name ?? `Chain ${chainId}`
}
