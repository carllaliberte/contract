import {
  connectWallet,
  disconnectWallet,
  fetchConnectedMetaBalance,
  getChainName,
  getConnectedAccount,
  isWalletConnectConfigured,
  onAccountChange,
  shortenAddress,
  supportedChains,
  switchWalletChain,
  tryReconnect,
  type WalletAccount,
  type WalletConnectorId,
} from './index'

type WalletBarCallbacks = {
  onAddressChange: (address: string | null) => void
}

let walletBarCallbacks: WalletBarCallbacks | null = null

function dispatchWalletStatus(message: string, type: 'info' | 'error' | 'success' = 'info') {
  window.dispatchEvent(new CustomEvent('wallet-status', { detail: { message, type } }))
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
    button.textContent = 'Connecting…'

    try {
      await connectWallet(connectorId)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to connect wallet'
      dispatchWalletStatus(message, 'error')
      renderWalletBar(walletBar)
    }
  })
}

function renderDisconnected(walletBar: HTMLElement) {
  const walletConnectReady = isWalletConnectConfigured()

  walletBar.innerHTML = `
    <div class="wallet-bar__info">
      <p class="wallet-bar__label">Connect a wallet</p>
      <p class="wallet-bar__hint">Choose MetaMask, Coinbase, or WalletConnect (Crypto.com &amp; mobile wallets).</p>
      ${
        walletConnectReady
          ? ''
          : '<p class="wallet-bar__hint wallet-bar__hint--warning">WalletConnect is disabled: set <code>VITE_WALLETCONNECT_PROJECT_ID</code> at build time.</p>'
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
        <span class="wallet-btn__sub">Crypto.com &amp; others</span>
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

  balanceEl.textContent = 'Loading META balance…'

  const balance = await fetchConnectedMetaBalance(address, chainId)
  if (!document.body.contains(walletBar)) {
    return
  }

  if (balance === null) {
    balanceEl.textContent = 'META balance unavailable on this network'
    return
  }

  balanceEl.textContent = `${balance} META`
}

function renderConnected(walletBar: HTMLElement, account: WalletAccount) {
  const address = account.address ?? ''
  const chainId = account.chainId ?? supportedChains[0].id

  walletBar.innerHTML = `
    <div class="wallet-bar__info">
      <p class="wallet-bar__label">Connected</p>
      <p class="wallet-bar__address mono" title="${address}">${shortenAddress(address)}</p>
      <p class="wallet-bar__chain">${getChainName(chainId)}</p>
      <p class="wallet-bar__balance" id="wallet-meta-balance">Loading META balance…</p>
    </div>
    <div class="wallet-bar__actions">
      <label class="wallet-chain-select">
        <span class="sr-only">Switch chain</span>
        <select id="wallet-chain-select" aria-label="Switch chain">
          ${supportedChains
            .map(
              (chain) =>
                `<option value="${chain.id}"${chain.id === chainId ? ' selected' : ''}>${chain.name}</option>`,
            )
            .join('')}
        </select>
      </label>
      <button type="button" id="wallet-switch-chain" class="wallet-btn wallet-btn--secondary">Switch chain</button>
      <button type="button" id="wallet-disconnect" class="wallet-btn wallet-btn--ghost">Disconnect</button>
    </div>
  `

  void loadMetaBalance(walletBar, address, chainId)

  const chainSelect = walletBar.querySelector<HTMLSelectElement>('#wallet-chain-select')!
  const switchButton = walletBar.querySelector<HTMLButtonElement>('#wallet-switch-chain')!
  const disconnectButton = walletBar.querySelector<HTMLButtonElement>('#wallet-disconnect')!

  switchButton.addEventListener('click', async () => {
    const selectedChainId = Number(chainSelect.value)
    if (selectedChainId === chainId) {
      dispatchWalletStatus(`Already on ${getChainName(selectedChainId)}`, 'info')
      return
    }

    switchButton.disabled = true
    switchButton.textContent = 'Switching…'

    try {
      await switchWalletChain(selectedChainId)
      dispatchWalletStatus(`Switched to ${getChainName(selectedChainId)}`, 'success')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to switch chain'
      dispatchWalletStatus(message, 'error')
    } finally {
      renderWalletBar(walletBar)
    }
  })

  disconnectButton.addEventListener('click', async () => {
    disconnectButton.disabled = true
    disconnectButton.textContent = 'Disconnecting…'

    try {
      await disconnectWallet()
      dispatchWalletStatus('Wallet disconnected', 'info')
      walletBarCallbacks?.onAddressChange(null)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to disconnect wallet'
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
