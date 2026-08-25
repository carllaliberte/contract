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
import { isWalletConnectConfigured, wagmiConfig } from './config'
import { getChainName, supportedChains, type SupportedChain } from './chains'

export { supportedChains, getChainName, isWalletConnectConfigured, wagmiConfig }

export type WalletAccount = GetAccountReturnType

export type WalletConnectorId = 'metaMask' | 'coinbaseWalletSDK' | 'walletConnect'

export const walletConnectorLabels: Record<WalletConnectorId, string> = {
  metaMask: 'MetaMask',
  coinbaseWalletSDK: 'Coinbase Wallet',
  walletConnect: 'Crypto.com DeFi Wallet',
}

function getConnector(id: WalletConnectorId) {
  return getConnectors(wagmiConfig).find((connector) => connector.id === id)
}

export function getAvailableConnectors(): WalletConnectorId[] {
  const ids: WalletConnectorId[] = ['metaMask', 'coinbaseWalletSDK']
  if (isWalletConnectConfigured()) {
    ids.push('walletConnect')
  }
  return ids
}

export async function connectWallet(connectorId: WalletConnectorId): Promise<void> {
  const connector = getConnector(connectorId)

  if (!connector) {
    if (connectorId === 'walletConnect') {
      throw new Error('WalletConnect nécessite VITE_WALLETCONNECT_PROJECT_ID au build.')
    }
    throw new Error('Connecteur de portefeuille indisponible.')
  }

  await connect(wagmiConfig, { connector })
}

export async function disconnectWallet(): Promise<void> {
  await disconnect(wagmiConfig)
}

export async function switchWalletChain(chainId: number): Promise<void> {
  const chain = supportedChains.find((entry) => entry.id === chainId)
  if (!chain) {
    throw new Error(`Réseau non pris en charge : ${chainId}`)
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
