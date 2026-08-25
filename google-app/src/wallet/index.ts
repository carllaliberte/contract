import {
  connect,
  disconnect,
  getAccount,
  getConnectors,
  reconnect,
  switchChain,
  watchAccount,
  type GetAccountReturnType,
} from '@wagmi/core'
import { fetchWalletSnapshot } from '../contract'
import { getContractAddress, isContractConfigured } from '../config'
import { getRpcUrlForChain } from './chains'
import { isWalletConnectConfigured, wagmiConfig } from './config'
import { getChainName, supportedChains, type SupportedChain } from './chains'

export { supportedChains, getChainName, isWalletConnectConfigured, wagmiConfig }

export type WalletAccount = GetAccountReturnType

export type WalletConnectorId = 'metaMask' | 'coinbaseWalletSDK' | 'walletConnect'

const connectorLabels: Record<WalletConnectorId, string> = {
  metaMask: 'MetaMask',
  coinbaseWalletSDK: 'Coinbase',
  walletConnect: 'WalletConnect',
}

export function getConnectorLabel(id: WalletConnectorId): string {
  return connectorLabels[id]
}

function getConnector(id: WalletConnectorId) {
  return getConnectors(wagmiConfig).find((connector) => connector.id === id)
}

export async function connectWallet(connectorId: WalletConnectorId): Promise<void> {
  if (connectorId === 'walletConnect' && !isWalletConnectConfigured()) {
    throw new Error('Set VITE_WALLETCONNECT_PROJECT_ID at build time to use WalletConnect')
  }

  const connector = getConnector(connectorId)
  if (!connector) {
    throw new Error(`${getConnectorLabel(connectorId)} connector is not available`)
  }

  await connect(wagmiConfig, { connector })
}

export async function disconnectWallet(): Promise<void> {
  await disconnect(wagmiConfig)
}

export async function switchWalletChain(chainId: number): Promise<void> {
  const chain = supportedChains.find((entry) => entry.id === chainId)
  if (!chain) {
    throw new Error(`Unsupported chain: ${chainId}`)
  }

  await switchChain(wagmiConfig, { chainId: chain.id as SupportedChain['id'] })
}

export function getConnectedAccount(): WalletAccount {
  return getAccount(wagmiConfig)
}

export function onAccountChange(callback: (account: WalletAccount) => void): () => void {
  return watchAccount(wagmiConfig, { onChange: callback })
}

export async function tryReconnect(): Promise<void> {
  await reconnect(wagmiConfig)
}

export function shortenAddress(address: string): string {
  return `${address.slice(0, 6)}…${address.slice(-4)}`
}

export async function fetchConnectedMetaBalance(
  address: string,
  chainId: number,
): Promise<string | null> {
  if (!isContractConfigured()) {
    return null
  }

  const rpcUrl = getRpcUrlForChain(chainId)
  if (!rpcUrl) {
    return null
  }

  try {
    const snapshot = await fetchWalletSnapshot(address, getContractAddress(), rpcUrl)
    return snapshot.balance
  } catch {
    return null
  }
}
