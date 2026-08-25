import { classifyWalletError, WalletError } from '../lib/walletErrors'
import {
  metaEntitlements,
  tierDescription,
  tierLabel,
  type MetaTier,
} from '../../../shared/meta-entitlements'
import {
  connectWallet,
  disconnectWallet,
  getConnectedAccount,
  isWalletConnectConfigured,
  onAccountChange,
  shortenAddress,
  signWalletMessage,
  switchWalletChain,
  tryReconnect,
  type WalletAccount,
  type WalletConnectorId,
} from './index'
import { defaultChain, getChainName, isSupportedChainId, supportedChains } from './chains'

const DISCLAIMER =
  'Connexion non-custodiale — nous ne détenons jamais vos clés. / Non-custodial — we never hold your keys.'

const SIGN_MESSAGE = 'META Token Dashboard — Vérification de propriété du portefeuille'

export type WalletEntitlementsView = {
  balance?: string
  symbol?: string
  tier?: MetaTier
  loading: boolean
  error?: string
}

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

let entitlementsView: WalletEntitlementsView | null = null
let walletBarElement: HTMLElement | null = null
let walletBarCallbacks: WalletBarCallbacks | null = null
let lastConnectorId: WalletConnectorId | null = null

export function setWalletEntitlements(view: WalletEntitlementsView | null): void {
  entitlementsView = view
  if (walletBarElement) {
    renderWalletBar(walletBarElement)
  }
}

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

function renderDisclaimer(): string {
  return `<p class="wallet-bar__disclaimer" role="note">${DISCLAIMER}</p>`
}

function renderEntitlements(): string {
  if (!entitlementsView) return ''

  if (entitlementsView.loading) {
    return `<p class="wallet-bar__meta wallet-bar__meta--loading">Chargement du solde META…</p>`
  }

  if (entitlementsView.error) {
    return `<p class="wallet-bar__meta wallet-bar__meta--error" role="alert">${entitlementsView.error}</p>`
  }

  if (!entitlementsView.balance || !entitlementsView.tier) return ''

  const label = tierLabel(entitlementsView.tier)
  const description = tierDescription(entitlementsView.tier)

  return `
    <div class="wallet-bar__meta">
      <p class="wallet-bar__balance">
        <span class="wallet-bar__balance-label">Solde META</span>
        <strong>${entitlementsView.balance} ${entitlementsView.symbol ?? metaEntitlements.symbol}</strong>
      </p>
      <p class="wallet-bar__tier-row">
        <span class="wallet-tier wallet-tier--${entitlementsView.tier}">${label}</span>
        <span class="wallet-bar__tier-hint">${description}</span>
      </p>
    </div>
  `
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
    ${renderDisclaimer()}
    <div class="wallet-bar__body">
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
    </div>
  `

  walletBar.querySelectorAll<HTMLButtonElement>('[data-connector]').forEach((button) => {
    const connectorId = button.dataset.connector as WalletConnectorId
    void bindConnectorButton(walletBar, button, connectorId)
  })
}

function renderUnsupportedChainBanner(chainId: number): string {
  return `
    <div class="wallet-bar__unsupported" role="alert">
      <p>
        <strong>Réseau non pris en charge :</strong> ${getChainName(chainId)} (chain ID ${chainId}).
        Changez de réseau pour utiliser ce tableau de bord.
      </p>
      <button type="button" id="wallet-switch-default" class="wallet-btn wallet-btn--secondary">
        Passer à ${defaultChain.name}
      </button>
    </div>
  `
}

function renderConnected(walletBar: HTMLElement, account: WalletAccount) {
  const address = account.address ?? ''
  const chainId = account.chainId
  const onSupportedChain = isSupportedChainId(chainId)
  const displayChainId = onSupportedChain ? chainId! : (chainId ?? defaultChain.id)

  walletBar.innerHTML = `
    ${renderDisclaimer()}
    ${chainId !== undefined && !onSupportedChain ? renderUnsupportedChainBanner(chainId) : ''}
    <div class="wallet-bar__body">
      <div class="wallet-bar__info">
        <p class="wallet-bar__label">Connecté</p>
        <p class="wallet-bar__address mono" title="${address}">${shortenAddress(address)}</p>
        <p class="wallet-bar__chain">${getChainName(displayChainId)}</p>
        ${renderEntitlements()}
      </div>
      <div class="wallet-bar__actions">
        <label class="wallet-chain-select">
          <span class="sr-only">Changer de réseau</span>
          <select id="wallet-chain-select" aria-label="Changer de réseau">
            ${supportedChains
              .map(
                (chain) =>
                  `<option value="${chain.id}"${chain.id === displayChainId ? ' selected' : ''}>${chain.name}</option>`,
              )
              .join('')}
          </select>
        </label>
        <button type="button" id="wallet-switch-chain" class="wallet-btn wallet-btn--secondary">Changer de réseau</button>
        <button type="button" id="wallet-sign-message" class="wallet-btn wallet-btn--primary">Signer un message</button>
        <button type="button" id="wallet-disconnect" class="wallet-btn wallet-btn--ghost">Déconnecter</button>
      </div>
    </div>
  `

  walletBar.querySelector<HTMLButtonElement>('#wallet-switch-default')?.addEventListener('click', async () => {
    try {
      await switchWalletChain(defaultChain.id)
      dispatchWalletStatus({ message: `Réseau changé : ${defaultChain.name}.`, type: 'success' })
      window.dispatchEvent(
        new CustomEvent('wallet-chain-changed', { detail: { chainId: defaultChain.id } }),
      )
    } catch (error) {
      presentWalletError(error, defaultChain.id)
    } finally {
      renderWalletBar(walletBar)
    }
  })

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
      window.dispatchEvent(
        new CustomEvent('wallet-chain-changed', { detail: { chainId: selectedChainId } }),
      )
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
      setWalletEntitlements(null)
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
      window.dispatchEvent(new CustomEvent('wallet-chain-changed', { detail: { chainId } }))
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

export function initWalletUi(
  walletBar: HTMLElement,
  onAddressChange: (address: string | null) => void,
  onChainChange?: (chainId: number) => void,
): void {
  walletBarElement = walletBar
  walletBarCallbacks = { onAddressChange }
  renderWalletBar(walletBar)

  onAccountChange((account) => {
    renderWalletBar(walletBar)
    onAddressChange(account.isConnected && account.address ? account.address : null)
    if (account.chainId !== undefined && isSupportedChainId(account.chainId)) {
      onChainChange?.(account.chainId)
    }
  })

  void tryReconnect().then(() => {
    renderWalletBar(walletBar)
    const account = getConnectedAccount()
    onAddressChange(account.isConnected && account.address ? account.address : null)
    if (account.chainId !== undefined && isSupportedChainId(account.chainId)) {
      onChainChange?.(account.chainId)
    }
  })
}
