import { createConfig, http } from '@wagmi/core'
import { injected, walletConnect } from '@wagmi/connectors'
import { mainnet, sepolia } from '@wagmi/core/chains'
import { getRpcUrl, getWalletConnectProjectId } from '../config'
import { supportedChains } from './chains'

const projectId = getWalletConnectProjectId()

const connectors = [
  ...(projectId
    ? [
        walletConnect({
          projectId,
          metadata: {
            name: 'META Token Dashboard',
            description: 'Read-only dashboard for the META ERC-20 contract',
            url: typeof window !== 'undefined' ? window.location.origin : 'https://carllaliberte.github.io/contract/',
            icons: [
              typeof window !== 'undefined'
                ? `${window.location.origin}${import.meta.env.BASE_URL}favicon.svg`
                : 'https://carllaliberte.github.io/contract/favicon.svg',
            ],
          },
          showQrModal: true,
        }),
      ]
    : []),
  injected({ shimDisconnect: true }),
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
