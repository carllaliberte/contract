import {
  connect,
  disconnect,
  getAccount,
  getConnectors,
  reconnect,
  sendTransaction,
  signMessage,
  switchChain,
  watchAccount,
  type GetAccountReturnType,
  type SendTransactionParameters,
} from '@wagmi/core'
import type { Hash, Hex } from 'viem'
import { toWalletError } from '../lib/walletErrors'
import { isWalletConnectConfigured, wagmiConfig } from './config'
import { supportedChains, type SupportedChain } from './chains'

export {
  chainEntries,
  defaultChain,
  getChainName,
  getChainRpcUrl,
  isSupportedChainId,
  supportedChains,
  WALLETCONNECT_APP_URL,
} from './chains'
export { isWalletConnectConfigured, wagmiConfig }
export { classifyWalletError, WalletError, type ClassifiedWalletError } from '../lib/walletErrors'

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

export function hasInjectedWallet(): boolean {
  return typeof window !== 'undefined' && Boolean(window.ethereum)
}

async function runWalletOperation<T>(operation: () => Promise<T>, chainId?: number): Promise<T> {
  try {
    return await operation()
  } catch (error) {
    throw toWalletError(error, chainId)
  }
}

export async function connectWallet(connectorId: WalletConnectorId): Promise<void> {
  if (connectorId === 'walletConnect' && !isWalletConnectConfigured()) {
    throw toWalletError(new Error('Set VITE_WALLETCONNECT_PROJECT_ID at build time to use WalletConnect'))
  }

  const connector = getConnector(connectorId)
  if (!connector) {
    throw toWalletError(new Error(`${getConnectorLabel(connectorId)} connector is not available`))
  }

  await runWalletOperation(() => connect(wagmiConfig, { connector }))
}

export async function disconnectWallet(): Promise<void> {
  await runWalletOperation(() => disconnect(wagmiConfig))
}

export async function switchWalletChain(chainId: number): Promise<void> {
  const chain = supportedChains.find((entry) => entry.id === chainId)
  if (!chain) {
    throw toWalletError(new Error(`Unsupported chain: ${chainId}`), chainId)
  }

  await runWalletOperation(
    () => switchChain(wagmiConfig, { chainId: chain.id as SupportedChain['id'] }),
    chainId,
  )
}

export async function signWalletMessage(message: string): Promise<Hex> {
  const account = getAccount(wagmiConfig)
  return runWalletOperation(
    () => signMessage(wagmiConfig, { message }),
    account.chainId,
  )
}

export async function sendWalletTransaction(
  request: SendTransactionParameters<typeof wagmiConfig>,
): Promise<Hash> {
  const account = getAccount(wagmiConfig)
  return runWalletOperation(
    () => sendTransaction(wagmiConfig, request),
    account.chainId ?? ('chainId' in request ? Number(request.chainId) : undefined),
  )
}

export function getConnectedAccount(): WalletAccount {
  return getAccount(wagmiConfig)
}

export function onAccountChange(callback: (account: WalletAccount) => void): () => void {
  return watchAccount(wagmiConfig, { onChange: callback })
}

export async function tryReconnect(): Promise<void> {
  try {
    await reconnect(wagmiConfig)
  } catch {
    // Silent on startup — user can reconnect manually.
  }
}

export function shortenAddress(address: string): string {
  return `${address.slice(0, 6)}…${address.slice(-4)}`
}
