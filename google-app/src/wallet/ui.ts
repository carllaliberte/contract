import { classifyWalletError, WalletError } from '../lib/walletErrors'
import {
  connectWallet,
  disconnectWallet,
  fetchConnectedMetaBalance,
  getChainName,
  getConnectedAccount,
  isWalletConnectConfigured,
  onAccountChange,
  shortenAddress,
  signWalletMessage,
  supportedChains,
  switchWalletChain,
  tryReconnect,
  type WalletAccount,
  type WalletConnectorId,
} from './index'

type WalletBarCallbacks = {
  onAddressChange: (address: string | null) => void
}

type WalletStatusDetail = {
  message: string
  type: 'info' | 'error' | 'success'
  cta?: 'switch_chain' | 'reconnect'
  chainId?: number
  connectorId?: WalletConnectorId
}

let walletBarCallbacks: WalletBarCallbacks | null = null
let lastConnectorId: WalletConnectorId | null = null

const SIGN_MESSAGE = 'META Token Dashboard — Vérification de propriété du portefeuille'

function dispatchWalletStatus(detail: WalletStatusDetail) {
  window.dispatchEvent(new CustomEvent('wallet-status', { detail }))
}

function presentWalletError(error: unknown, chainId?: number) {
  const classified = error instanceof WalletError ? error.classified : classifyWalletError(error, chainId)
  dispatchWalletStatus({
    message: classified.message,
    type: 'error',
    cta: classified.cta,
    chainId: classified.chainId ?? chainId,
    connectorId: classified.cta === 'reconnect' ? (lastConnectorId ?? undefined) : undefined,
  })
}

async function bindConnectorButton(
  walletBar: HTMLElement,
  button: HTMLButtonElement,
  connectorId: WalletConnectorId,
) {
  button.addEventListener('click', async () => {
    const buttons = walletBar.querySelectorAll<HTMLButtonElement>('[data-connector]')
    buttons.forEach((entry) => {
      entry.disabled = true
    })
    const originalLabel = button.innerHTML
    button.textContent = 'Connexion…'

    try {
      await connectWallet(connectorId)
      lastConnectorId = connectorId
      dispatchWalletStatus({ message: 'Portefeuille connecté.', type: 'success' })
    } catch (error) {
      presentWalletError(error)
      renderWalletBar(walletBar)
      return
    }

    button.innerHTML = originalLabel
    renderWalletBar(walletBar)
  })
}

function renderDisconnected(walletBar: HTMLElement) {
  const walletConnectReady = isWalletConnectConfigured()

  walletBar.innerHTML = `
    <div class="wallet-bar__info">
      <p class="wallet-bar__label">Connecter un portefeuille</p>
      <p class="wallet-bar__hint">MetaMask, Coinbase ou WalletConnect (Crypto.com et portefeuilles mobiles).</p>
      ${
        walletConnectReady
          ? ''
          : '<p class="wallet-bar__hint wallet-bar__hint--warning">WalletConnect désactivé : définissez <code>VITE_WALLETCONNECT_PROJECT_ID</code> au build.</p>'
      }
    </div>
    <div class="wallet-bar__actions wallet-connectors">
      <button type="button" data-connector="metaMask" class="wallet-btn wallet-btn--connector wallet-btn--primary">MetaMask</button>
      <button type="button" data-connector="coinbaseWalletSDK" class="wallet-btn wallet-btn--connector wallet-btn--secondary">Coinbase</button>
      <button
        type="button"
        data-connector="walletConnect"
        class="wallet-btn wallet-btn--connector wallet-btn--ghost"
        ${walletConnectReady ? '' : 'disabled'}
      >
        WalletConnect
        <span class="wallet-btn__sub">Crypto.com &amp; autres</span>
      </button>
    </div>
  `

  walletBar.querySelectorAll<HTMLButtonElement>('[data-connector]').forEach((button) => {
    const connectorId = button.dataset.connector as WalletConnectorId
    void bindConnectorButton(walletBar, button, connectorId)
  })
}

async function loadMetaBalance(walletBar: HTMLElement, address: string, chainId: number) {
  const balanceEl = walletBar.querySelector<HTMLElement>('#wallet-meta-balance')
  if (!balanceEl) {
    return
  }

  balanceEl.textContent = 'Chargement du solde META…'

  const balance = await fetchConnectedMetaBalance(address, chainId)
  if (!document.body.contains(walletBar)) {
    return
  }

  if (balance === null) {
    balanceEl.textContent = 'Solde META indisponible sur ce réseau'
    return
  }

  balanceEl.textContent = `${balance} META`
}

function renderConnected(walletBar: HTMLElement, account: WalletAccount) {
  const address = account.address ?? ''
  const chainId = account.chainId ?? supportedChains[0].id

  walletBar.innerHTML = `
    <div class="wallet-bar__info">
      <p class="wallet-bar__label">Connecté</p>
      <p class="wallet-bar__address mono" title="${address}">${shortenAddress(address)}</p>
      <p class="wallet-bar__chain">${getChainName(chainId)}</p>
      <p class="wallet-bar__balance" id="wallet-meta-balance">Chargement du solde META…</p>
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
      <button type="button" id="wallet-sign-message" class="wallet-btn wallet-btn--primary">Signer un message</button>
      <button type="button" id="wallet-disconnect" class="wallet-btn wallet-btn--ghost">Déconnecter</button>
    </div>
  `

  void loadMetaBalance(walletBar, address, chainId)

  const chainSelect = walletBar.querySelector<HTMLSelectElement>('#wallet-chain-select')!
  const switchButton = walletBar.querySelector<HTMLButtonElement>('#wallet-switch-chain')!
  const signButton = walletBar.querySelector<HTMLButtonElement>('#wallet-sign-message')!
  const disconnectButton = walletBar.querySelector<HTMLButtonElement>('#wallet-disconnect')!

  switchButton.addEventListener('click', async () => {
    const selectedChainId = Number(chainSelect.value)
    if (selectedChainId === chainId) {
      dispatchWalletStatus({ message: `Déjà sur ${getChainName(selectedChainId)}.`, type: 'info' })
      return
    }

    switchButton.disabled = true
    switchButton.textContent = 'Changement…'

    try {
      await switchWalletChain(selectedChainId)
      dispatchWalletStatus({ message: `Réseau changé : ${getChainName(selectedChainId)}.`, type: 'success' })
    } catch (error) {
      presentWalletError(error, selectedChainId)
    } finally {
      renderWalletBar(walletBar)
    }
  })

  signButton.addEventListener('click', async () => {
    signButton.disabled = true
    signButton.textContent = 'Signature…'

    try {
      const signature = await signWalletMessage(SIGN_MESSAGE)
      dispatchWalletStatus({
        message: `Message signé (${signature.slice(0, 10)}…${signature.slice(-8)}).`,
        type: 'success',
      })
    } catch (error) {
      presentWalletError(error, chainId)
    } finally {
      if (document.body.contains(walletBar)) {
        signButton.disabled = false
        signButton.textContent = 'Signer un message'
      }
    }
  })

  disconnectButton.addEventListener('click', async () => {
    disconnectButton.disabled = true
    disconnectButton.textContent = 'Déconnexion…'

    try {
      await disconnectWallet()
      dispatchWalletStatus({ message: 'Portefeuille déconnecté.', type: 'info' })
      walletBarCallbacks?.onAddressChange(null)
    } catch (error) {
      presentWalletError(error, chainId)
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

export async function handleWalletStatusCta(
  walletBar: HTMLElement,
  action: 'switch_chain' | 'reconnect',
  chainId?: number,
  connectorId?: WalletConnectorId,
): Promise<void> {
  if (action === 'switch_chain' && chainId !== undefined) {
    try {
      await switchWalletChain(chainId)
      dispatchWalletStatus({ message: `Réseau changé : ${getChainName(chainId)}.`, type: 'success' })
    } catch (error) {
      presentWalletError(error, chainId)
    } finally {
      renderWalletBar(walletBar)
    }
    return
  }

  if (action === 'reconnect' && connectorId) {
    try {
      await connectWallet(connectorId)
      lastConnectorId = connectorId
      dispatchWalletStatus({ message: 'Portefeuille reconnecté.', type: 'success' })
    } catch (error) {
      presentWalletError(error, chainId)
    } finally {
      renderWalletBar(walletBar)
    }
  }
}

export function initWalletUi(walletBar: HTMLElement, onAddressChange: (address: string | null) => void): void {
  walletBarCallbacks = { onAddressChange }
  renderWalletBar(walletBar)

  onAccountChange((account) => {
    renderWalletBar(walletBar)
    onAddressChange(account.isConnected && account.address ? account.address : null)
  })

  void tryReconnect().then(() => {
    renderWalletBar(walletBar)
    const account = getConnectedAccount()
    onAddressChange(account.isConnected && account.address ? account.address : null)
  })
}
