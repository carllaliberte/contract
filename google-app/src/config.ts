import { isAddress } from 'ethers'

export const DEFAULT_RPC_URL = 'https://ethereum-sepolia-rpc.publicnode.com'

export const DEFAULT_CONTRACT_ADDRESS = '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512'

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

export function getWalletConnectProjectId(): string | undefined {
  const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID?.trim()
  return projectId || undefined
}

export function isContractConfigured(): boolean {
  const address = getContractAddress()
  return Boolean(address && isAddress(address))
}
