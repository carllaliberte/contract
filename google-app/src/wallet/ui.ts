import {
  connectWallet,
  disconnectWallet,
  getAvailableConnectors,
  getChainName,
  getConnectedAccount,
  isWalletConnectConfigured,
  onAccountChange,
  shortenAddress,
  supportedChains,
  switchWalletChain,
  tryReconnect,
  walletConnectorLabels,
  type WalletAccount,
  type WalletConnectorId,
} from './index'
import { disconnectedMessage, isWrongChain, parseWalletError, wrongChainMessage } from './errors'

function dispatchWalletStatus(message: string, type: 'info' | 'error' | 'success') {
  window.dispatchEvent(new CustomEvent('wallet-status', { detail: { message, type } }))
}

function renderDisconnected(walletBar: HTMLElement) {
  const missingProjectId = !isWalletConnectConfigured()
  const connectors = getAvailableConnectors()

  walletBar.innerHTML = `
    <div class="wallet-bar__info">
      <p class="wallet-bar__label">Choisissez un portefeuille pour vous connecter en lecture seule.</p>
      ${
        missingProjectId
          ? '<p class="wallet-bar__hint">Crypto.com et autres mobiles nécessitent <code>VITE_WALLETCONNECT_PROJECT_ID</code> au build.</p>'
          : '<p class="wallet-bar__hint">Crypto.com DeFi Wallet et autres portefeuilles mobiles passent par WalletConnect.</p>'
      }
    </div>
    <div class="wallet-bar__actions wallet-bar__actions--connectors">
      ${connectors
        .map(
          (connectorId) => `
            <button
              type="button"
              class="wallet-btn wallet-btn--connector"
              data-connector="${connectorId}"
            >
              ${walletConnectorLabels[connectorId]}
            </button>
          `,
        )
        .join('')}
    </div>
  `

  walletBar.querySelectorAll<HTMLButtonElement>('[data-connector]').forEach((button) => {
    button.addEventListener('click', async () => {
      const connectorId = button.dataset.connector as WalletConnectorId
      button.disabled = true
      const originalLabel = button.textContent
      button.textContent = 'Connexion…'

      try {
        await connectWallet(connectorId)
        dispatchWalletStatus(`Connecté via ${walletConnectorLabels[connectorId]}`, 'success')
      } catch (error) {
        const { kind, message } = parseWalletError(error)
        dispatchWalletStatus(message, kind === 'rejected' ? 'info' : 'error')
        renderWalletBar(walletBar)
        return
      }

      button.disabled = false
      button.textContent = originalLabel
    })
  })
}

function renderConnected(walletBar: HTMLElement, account: WalletAccount) {
  const address = account.address ?? ''
  const chainId = account.chainId ?? supportedChains[0].id
  const wrongChain = isWrongChain(account)

  walletBar.innerHTML = `
    <div class="wallet-bar__info">
      <p class="wallet-bar__label">${wrongChain ? 'Connecté — réseau incorrect' : 'Connecté'}</p>
      <p class="wallet-bar__address mono" title="${address}">${shortenAddress(address)}</p>
      <p class="wallet-bar__chain">${wrongChain ? 'Réseau non pris en charge' : getChainName(chainId)}</p>
    </div>
    <div class="wallet-bar__actions">
      <label class="wallet-chain-select">
        <span class="sr-only">Changer de réseau</span>
        <select id="wallet-chain-select" aria-label="Changer de réseau">
          ${supportedChains
            .map(
              (chain) =>
                `<option value="${chain.id}"${chain.id === chainId ? ' selected' : ''}>${chain.name}</option>`,
            )
            .join('')}
        </select>
      </label>
      <button type="button" id="wallet-switch-chain" class="wallet-btn wallet-btn--secondary">Changer de réseau</button>
      <button type="button" id="wallet-disconnect" class="wallet-btn wallet-btn--ghost">Déconnecter</button>
    </div>
  `

  if (wrongChain) {
    dispatchWalletStatus(wrongChainMessage(chainId).message, 'error')
  }

  const chainSelect = walletBar.querySelector<HTMLSelectElement>('#wallet-chain-select')!
  const switchButton = walletBar.querySelector<HTMLButtonElement>('#wallet-switch-chain')!
  const disconnectButton = walletBar.querySelector<HTMLButtonElement>('#wallet-disconnect')!

  switchButton.addEventListener('click', async () => {
    const selectedChainId = Number(chainSelect.value)
    if (!wrongChain && selectedChainId === chainId) {
      dispatchWalletStatus(`Déjà sur ${getChainName(selectedChainId)}`, 'info')
      return
    }

    switchButton.disabled = true
    switchButton.textContent = 'Changement…'

    try {
      await switchWalletChain(selectedChainId)
      dispatchWalletStatus(`Réseau basculé vers ${getChainName(selectedChainId)}`, 'success')
    } catch (error) {
      const { kind, message } = parseWalletError(error)
      dispatchWalletStatus(message, kind === 'rejected' ? 'info' : 'error')
    } finally {
      renderWalletBar(walletBar)
    }
  })

  disconnectButton.addEventListener('click', async () => {
    disconnectButton.disabled = true
    disconnectButton.textContent = 'Déconnexion…'

    try {
      await disconnectWallet()
      dispatchWalletStatus(disconnectedMessage().message, 'info')
    } catch (error) {
      const { message } = parseWalletError(error)
      dispatchWalletStatus(message, 'error')
    } finally {
      renderWalletBar(walletBar)
    }
  })
}

export function renderWalletBar(walletBar: HTMLElement): void {
  const account = getConnectedAccount()
  if (account.isConnected && account.address) {
    renderConnected(walletBar, account)
  } else {
    renderDisconnected(walletBar)
  }
}

export function initWalletUi(walletBar: HTMLElement, onAddressChange: (address: string | null) => void): void {
  let wasConnected = getConnectedAccount().isConnected

  renderWalletBar(walletBar)

  onAccountChange((account) => {
    if (wasConnected && account.status === 'disconnected') {
      dispatchWalletStatus(disconnectedMessage().message, 'info')
    }

    wasConnected = account.isConnected
    renderWalletBar(walletBar)
    onAddressChange(account.isConnected && account.address ? account.address : null)
  })

  void tryReconnect().then(() => {
    renderWalletBar(walletBar)
    const account = getConnectedAccount()
    onAddressChange(account.isConnected && account.address ? account.address : null)
  })
}
