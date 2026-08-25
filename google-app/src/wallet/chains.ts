import { arbitrum, base, mainnet, polygon, sepolia, type Chain } from '@wagmi/core/chains'
import { getRpcUrl } from '../config'

/** Supported chains — mainnet, sepolia, polygon, arbitrum, base. */
export const supportedChains = [mainnet, sepolia, polygon, arbitrum, base] as const satisfies readonly [
  Chain,
  ...Chain[],
]

export type SupportedChain = (typeof supportedChains)[number]

const chainRpcUrls: Record<number, string> = {
  [mainnet.id]: 'https://eth.llamarpc.com',
  [sepolia.id]: getRpcUrl(),
  [polygon.id]: 'https://polygon-rpc.com',
  [arbitrum.id]: 'https://arb1.arbitrum.io/rpc',
  [base.id]: 'https://mainnet.base.org',
}

export function getChainById(chainId: number): SupportedChain | undefined {
  return supportedChains.find((chain) => chain.id === chainId)
}

export function getChainName(chainId: number): string {
  return getChainById(chainId)?.name ?? `Chain ${chainId}`
}

export function getRpcUrlForChain(chainId: number): string | undefined {
  return chainRpcUrls[chainId]
}
