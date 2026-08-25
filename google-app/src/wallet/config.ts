import { createConfig, http } from '@wagmi/core'
import { coinbaseWallet, injected, walletConnect } from '@wagmi/connectors'
import { mainnet, sepolia } from '@wagmi/core/chains'
import { getRpcUrl, getWalletConnectProjectId } from '../config'
import { supportedChains } from './chains'

const projectId = getWalletConnectProjectId()

const walletConnectMetadata = {
  name: 'META Token Dashboard',
  description: 'Tableau de bord en lecture seule pour le contrat ERC-20 META',
  url: typeof window !== 'undefined' ? window.location.origin : 'https://carllaliberte.github.io/contract/',
  icons: [
    typeof window !== 'undefined'
      ? `${window.location.origin}${import.meta.env.BASE_URL}favicon.svg`
      : 'https://carllaliberte.github.io/contract/favicon.svg',
  ],
}

const connectors = [
  injected({
    target: 'metaMask',
    shimDisconnect: true,
  }),
  coinbaseWallet({
    appName: walletConnectMetadata.name,
    appLogoUrl: walletConnectMetadata.icons[0],
  }),
  ...(projectId
    ? [
        walletConnect({
          projectId,
          metadata: walletConnectMetadata,
          showQrModal: true,
        }),
      ]
    : []),
]

export const wagmiConfig = createConfig({
  chains: supportedChains,
  connectors,
  transports: {
    [sepolia.id]: http(getRpcUrl()),
    [mainnet.id]: http(),
  },
})

export function isWalletConnectConfigured(): boolean {
  return Boolean(projectId)
}
