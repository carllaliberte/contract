import {
  connectWallet,
  disconnectWallet,
  getChainName,
  getConnectedAccount,
  isWalletConnectConfigured,
  onAccountChange,
  shortenAddress,
  supportedChains,
  switchWalletChain,
  tryReconnect,
  type WalletAccount,
} from './index'

function renderDisconnected(walletBar: HTMLElement) {
  const missingProjectId = !isWalletConnectConfigured()

  walletBar.innerHTML = `
    <div class="wallet-bar__info">
      <p class="wallet-bar__label">Connect a wallet via WalletConnect or browser extension.</p>
      ${
        missingProjectId
          ? '<p class="wallet-bar__hint">WalletConnect requires <code>VITE_WALLETCONNECT_PROJECT_ID</code> at build time.</p>'
          : ''
      }
    </div>
    <div class="wallet-bar__actions">
      <button type="button" id="wallet-connect" class="wallet-btn wallet-btn--primary">Connect wallet</button>
    </div>
  `

  walletBar.querySelector<HTMLButtonElement>('#wallet-connect')!.addEventListener('click', async () => {
    const button = walletBar.querySelector<HTMLButtonElement>('#wallet-connect')!
    button.disabled = true
    button.textContent = 'Connecting…'

    try {
      await connectWallet()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to connect wallet'
      window.dispatchEvent(new CustomEvent('wallet-status', { detail: { message, type: 'error' } }))
      renderWalletBar(walletBar)
    }
  })
}

function renderConnected(walletBar: HTMLElement, account: WalletAccount) {
  const address = account.address ?? ''
  const chainId = account.chainId ?? supportedChains[0].id

  walletBar.innerHTML = `
    <div class="wallet-bar__info">
      <p class="wallet-bar__label">Connected</p>
      <p class="wallet-bar__address mono" title="${address}">${shortenAddress(address)}</p>
      <p class="wallet-bar__chain">${getChainName(chainId)}</p>
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

export function initWalletUi(walletBar: HTMLElement, onAddressChange: (address: string | null) => void): void {
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
