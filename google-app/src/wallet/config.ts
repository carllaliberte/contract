import { createConfig, http, type Transport } from '@wagmi/core'
import { coinbaseWallet, injected, walletConnect } from '@wagmi/connectors'
import { DASHBOARD_ICON_URL, DASHBOARD_NAME, getWalletConnectProjectId } from '../config'
import {
  chainEntries,
  getChainRpcUrl,
  getWalletConnectMetadata,
  supportedChains,
} from './chains'

const projectId = getWalletConnectProjectId()

const connectors = [
  injected({
    target: 'metaMask',
    shimDisconnect: true,
  }),
  coinbaseWallet({
    appName: DASHBOARD_NAME,
    appLogoUrl: DASHBOARD_ICON_URL,
  }),
  ...(projectId
    ? [
        walletConnect({
          projectId,
          metadata: getWalletConnectMetadata(
            typeof window !== 'undefined' ? window.location.origin : undefined,
          ),
          showQrModal: true,
        }),
      ]
    : []),
]

const transports = Object.fromEntries(
  chainEntries.map((entry) => {
    const rpcUrl = getChainRpcUrl(entry.chain.id)
    const transport: Transport = rpcUrl ? http(rpcUrl) : http()
    return [entry.chain.id, transport]
  }),
) as Record<(typeof supportedChains)[number]['id'], Transport>

export const wagmiConfig = createConfig({
  chains: supportedChains,
  connectors,
  transports,
})

export function isWalletConnectConfigured(): boolean {
  return Boolean(projectId)
}
