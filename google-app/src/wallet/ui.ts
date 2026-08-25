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
  hasInjectedWallet,
  isWalletConnectConfigured,
  onAccountChange,
  shortenAddress,
  switchWalletChain,
  tryReconnect,
  type WalletAccount,
} from './index'
import { defaultChain, getChainName, isSupportedChainId, supportedChains } from './chains'

const DISCLAIMER =
  'Connexion non-custodiale — nous ne détenons jamais vos clés. / Non-custodial — we never hold your keys.'

export type WalletEntitlementsView = {
  balance?: string
  symbol?: string
  tier?: MetaTier
  loading: boolean
  error?: string
}

let entitlementsView: WalletEntitlementsView | null = null
let walletBarElement: HTMLElement | null = null

export function setWalletEntitlements(view: WalletEntitlementsView | null): void {
  entitlementsView = view
  if (walletBarElement) {
    renderWalletBar(walletBarElement)
  }
}

function renderDisclaimer(): string {
  return `<p class="wallet-bar__disclaimer" role="note">${DISCLAIMER}</p>`
}

function renderEntitlements(): string {
  if (!entitlementsView) return ''

  if (entitlementsView.loading) {
    return `<p class="wallet-bar__meta wallet-bar__meta--loading">Loading META balance…</p>`
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
        <span class="wallet-bar__balance-label">META balance</span>
        <strong>${entitlementsView.balance} ${entitlementsView.symbol ?? metaEntitlements.symbol}</strong>
      </p>
      <p class="wallet-bar__tier-row">
        <span class="wallet-tier wallet-tier--${entitlementsView.tier}">${label}</span>
        <span class="wallet-bar__tier-hint">${description}</span>
      </p>
    </div>
  `
}

function renderDisconnected(walletBar: HTMLElement) {
  const missingProjectId = !isWalletConnectConfigured()
  const canUseInjected = hasInjectedWallet()
  const canConnect = isWalletConnectConfigured() || canUseInjected

  walletBar.innerHTML = `
    ${renderDisclaimer()}
    <div class="wallet-bar__body">
      <div class="wallet-bar__info">
        <p class="wallet-bar__label">Connect a wallet via WalletConnect or browser extension.</p>
        ${
          missingProjectId
            ? `<p class="wallet-bar__hint wallet-bar__hint--warn">
                WalletConnect is disabled: set <code>VITE_WALLETCONNECT_PROJECT_ID</code> at build time.
                ${canUseInjected ? 'You can still connect with a browser extension below.' : ''}
              </p>`
            : ''
        }
      </div>
      <div class="wallet-bar__actions">
        <button
          type="button"
          id="wallet-connect"
          class="wallet-btn wallet-btn--primary"
          ${canConnect ? '' : 'disabled'}
        >
          Connect wallet
        </button>
        ${
          missingProjectId && canUseInjected
            ? `<button type="button" id="wallet-connect-injected" class="wallet-btn wallet-btn--secondary">
                Connect browser wallet
              </button>`
            : ''
        }
      </div>
    </div>
  `

  const connectButton = walletBar.querySelector<HTMLButtonElement>('#wallet-connect')
  connectButton?.addEventListener('click', async () => {
    if (!connectButton || connectButton.disabled) return
    connectButton.disabled = true
    connectButton.textContent = 'Connecting…'

    try {
      await connectWallet()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to connect wallet'
      window.dispatchEvent(new CustomEvent('wallet-status', { detail: { message, type: 'error' } }))
      renderWalletBar(walletBar)
    }
  })

  walletBar.querySelector<HTMLButtonElement>('#wallet-connect-injected')?.addEventListener('click', async () => {
    const button = walletBar.querySelector<HTMLButtonElement>('#wallet-connect-injected')!
    button.disabled = true
    button.textContent = 'Connecting…'

    try {
      await connectWallet(true)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to connect wallet'
      window.dispatchEvent(new CustomEvent('wallet-status', { detail: { message, type: 'error' } }))
      renderWalletBar(walletBar)
    }
  })
}

function renderUnsupportedChainBanner(chainId: number): string {
  return `
    <div class="wallet-bar__unsupported" role="alert">
      <p>
        <strong>Unsupported network:</strong> ${getChainName(chainId)} (chain ID ${chainId}).
        Switch to a supported chain to use this dashboard.
      </p>
      <button type="button" id="wallet-switch-default" class="wallet-btn wallet-btn--secondary">
        Switch to ${defaultChain.name}
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
        <p class="wallet-bar__label">Connected</p>
        <p class="wallet-bar__address mono" title="${address}">${shortenAddress(address)}</p>
        <p class="wallet-bar__chain">${getChainName(displayChainId)}</p>
        ${renderEntitlements()}
      </div>
      <div class="wallet-bar__actions">
        <label class="wallet-chain-select">
          <span class="sr-only">Switch chain</span>
          <select id="wallet-chain-select" aria-label="Switch chain">
            ${supportedChains
              .map(
                (chain) =>
                  `<option value="${chain.id}"${chain.id === displayChainId ? ' selected' : ''}>${chain.name}</option>`,
              )
              .join('')}
          </select>
        </label>
        <button type="button" id="wallet-switch-chain" class="wallet-btn wallet-btn--secondary">Switch chain</button>
        <button type="button" id="wallet-disconnect" class="wallet-btn wallet-btn--ghost">Disconnect</button>
      </div>
    </div>
  `

  walletBar.querySelector<HTMLButtonElement>('#wallet-switch-default')?.addEventListener('click', async () => {
    try {
      await switchWalletChain(defaultChain.id)
      window.dispatchEvent(
        new CustomEvent('wallet-status', {
          detail: { message: `Switched to ${defaultChain.name}`, type: 'success' },
        }),
      )
      window.dispatchEvent(
        new CustomEvent('wallet-chain-changed', { detail: { chainId: defaultChain.id } }),
      )
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to switch chain'
      window.dispatchEvent(new CustomEvent('wallet-status', { detail: { message, type: 'error' } }))
    } finally {
      renderWalletBar(walletBar)
    }
  })

  const chainSelect = walletBar.querySelector<HTMLSelectElement>('#wallet-chain-select')!
  const switchButton = walletBar.querySelector<HTMLButtonElement>('#wallet-switch-chain')!
  const disconnectButton = walletBar.querySelector<HTMLButtonElement>('#wallet-disconnect')!

  switchButton.addEventListener('click', async () => {
    const selectedChainId = Number(chainSelect.value)
    if (selectedChainId === chainId) {
      window.dispatchEvent(
        new CustomEvent('wallet-status', {
          detail: { message: `Already on ${getChainName(selectedChainId)}`, type: 'info' },
        }),
      )
      return
    }

    switchButton.disabled = true
    switchButton.textContent = 'Switching…'

    try {
      await switchWalletChain(selectedChainId)
      window.dispatchEvent(
        new CustomEvent('wallet-status', {
          detail: { message: `Switched to ${getChainName(selectedChainId)}`, type: 'success' },
        }),
      )
      window.dispatchEvent(
        new CustomEvent('wallet-chain-changed', { detail: { chainId: selectedChainId } }),
      )
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to switch chain'
      window.dispatchEvent(new CustomEvent('wallet-status', { detail: { message, type: 'error' } }))
    } finally {
      renderWalletBar(walletBar)
    }
  })

  disconnectButton.addEventListener('click', async () => {
    disconnectButton.disabled = true
    disconnectButton.textContent = 'Disconnecting…'

    try {
      await disconnectWallet()
      setWalletEntitlements(null)
      window.dispatchEvent(
        new CustomEvent('wallet-status', { detail: { message: 'Wallet disconnected', type: 'info' } }),
      )
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to disconnect wallet'
      window.dispatchEvent(new CustomEvent('wallet-status', { detail: { message, type: 'error' } }))
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

export function initWalletUi(
  walletBar: HTMLElement,
  onAddressChange: (address: string | null) => void,
  onChainChange?: (chainId: number) => void,
): void {
  walletBarElement = walletBar
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
