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

export type WalletAccount = GetAccountReturnType

function getConnector(id: 'walletConnect' | 'injected') {
  return getConnectors(wagmiConfig).find((connector) => connector.id === id)
}

export function hasInjectedWallet(): boolean {
  return typeof window !== 'undefined' && Boolean(window.ethereum)
}

export async function connectWallet(preferInjected = false): Promise<void> {
  const walletConnectConnector = getConnector('walletConnect')
  const injectedConnector = getConnector('injected')

  const connector = preferInjected
    ? (injectedConnector ?? walletConnectConnector)
    : (walletConnectConnector ?? injectedConnector)

  if (!connector) {
    throw new Error(
      isWalletConnectConfigured()
        ? 'No wallet connector available'
        : 'Set VITE_WALLETCONNECT_PROJECT_ID or use a browser wallet extension',
    )
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
