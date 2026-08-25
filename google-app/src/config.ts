import { isAddress } from 'ethers'
import { metaEntitlements } from '../../shared/meta-entitlements'

export const DEFAULT_RPC_URL = 'https://ethereum-sepolia-rpc.publicnode.com'

export const DEFAULT_CONTRACT_ADDRESS = metaEntitlements.contractAddress

export const META_CHAIN_ID = metaEntitlements.chainId

export const DASHBOARD_ORIGIN = 'https://carllaliberte.github.io/contract'

export const DASHBOARD_NAME = 'META Token Dashboard'

export const DASHBOARD_DESCRIPTION = 'Read-only dashboard for the META ERC-20 contract'

export const DASHBOARD_ICON_URL = `${DASHBOARD_ORIGIN}/favicon.svg`

export function getRpcUrl(): string {
  return import.meta.env.VITE_RPC_URL?.trim() || DEFAULT_RPC_URL
}

export function getContractAddress(): string {
  return import.meta.env.VITE_CONTRACT_ADDRESS?.trim() || DEFAULT_CONTRACT_ADDRESS
}

export function getMetaChainId(): number {
  return META_CHAIN_ID
}

export function getWalletConnectProjectId(): string | undefined {
  const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID?.trim()
  return projectId || undefined
}

export function isContractConfigured(): boolean {
  const address = getContractAddress()
  return Boolean(address && isAddress(address))
}
