import { createConfig, http } from '@wagmi/core'
import { coinbaseWallet, injected, walletConnect } from '@wagmi/connectors'
import { arbitrum, base, mainnet, polygon, sepolia } from '@wagmi/core/chains'
import {
  DASHBOARD_DESCRIPTION,
  DASHBOARD_ICON_URL,
  DASHBOARD_NAME,
  DASHBOARD_ORIGIN,
  getRpcUrl,
  getWalletConnectProjectId,
} from '../config'
import { getRpcUrlForChain, supportedChains } from './chains'

const projectId = getWalletConnectProjectId()

const walletMetadata = {
  name: DASHBOARD_NAME,
  description: DASHBOARD_DESCRIPTION,
  url: DASHBOARD_ORIGIN,
  icons: [DASHBOARD_ICON_URL],
}

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
          metadata: walletMetadata,
          showQrModal: true,
        }),
      ]
    : []),
]

export const wagmiConfig = createConfig({
  chains: supportedChains,
  connectors,
  transports: {
    [mainnet.id]: http(getRpcUrlForChain(mainnet.id)),
    [sepolia.id]: http(getRpcUrl()),
    [polygon.id]: http(getRpcUrlForChain(polygon.id)),
    [arbitrum.id]: http(getRpcUrlForChain(arbitrum.id)),
    [base.id]: http(getRpcUrlForChain(base.id)),
  },
})

export function isWalletConnectConfigured(): boolean {
  return Boolean(projectId)
}
