import './style.css'
import { fetchTokenSnapshot, fetchWalletSnapshot } from './contract'
import { getContractAddress, getRpcUrl } from './config'
import { initWalletUi, handleWalletStatusCta } from './wallet/ui'

const app = document.querySelector<HTMLDivElement>('#app')!

app.innerHTML = `
  <header class="header">
    <div>
      <p class="eyebrow">Google App · GitHub Contract</p>
      <h1>META Token Dashboard</h1>
      <p class="subtitle">
        Read-only dashboard for the <code>META</code> ERC-20 contract from
        <a href="https://github.com/carllaliberte/contract" target="_blank" rel="noreferrer">carllaliberte/contract</a>.
        Deploy this app to Firebase Hosting or sync data into Google Sheets with Apps Script.
      </p>
    </div>
  </header>

  <section class="panel">
    <h2>Wallet</h2>
    <div id="wallet-bar" class="wallet-bar" aria-live="polite"></div>
    <div id="wallet-status" class="status hidden" aria-live="polite">
      <p id="wallet-status-message" class="wallet-status__message"></p>
      <div id="wallet-status-actions" class="wallet-status__actions hidden"></div>
    </div>
  </section>

  <section class="panel">
    <h2>Connection</h2>
    <form id="connection-form" class="form-grid">
      <label>
        RPC URL
        <input id="rpc-url" type="url" placeholder="https://eth.llamarpc.com" required />
      </label>
      <label>
        Contract address
        <input id="contract-address" type="text" placeholder="0x..." required />
      </label>
      <div class="actions">
        <button type="submit" id="load-token">Load token data</button>
      </div>
    </form>
    <p id="status" class="status" aria-live="polite"></p>
  </section>

  <section class="panel">
    <h2>Token overview</h2>
    <div id="token-grid" class="metric-grid">
      <div class="metric"><span>Name</span><strong id="token-name">—</strong></div>
      <div class="metric"><span>Symbol</span><strong id="token-symbol">—</strong></div>
      <div class="metric"><span>Decimals</span><strong id="token-decimals">—</strong></div>
      <div class="metric"><span>Total supply</span><strong id="token-supply">—</strong></div>
      <div class="metric"><span>Total fees</span><strong id="token-fees">—</strong></div>
      <div class="metric"><span>Owner</span><strong id="token-owner" class="mono">—</strong></div>
      <div class="metric"><span>Max tx amount</span><strong id="token-max-tx">—</strong></div>
      <div class="metric"><span>Sell lock (seconds)</span><strong id="token-timeout">—</strong></div>
      <div class="metric"><span>Uniswap pair</span><strong id="token-pair" class="mono">—</strong></div>
    </div>
  </section>

  <section class="panel">
    <h2>Wallet lookup</h2>
    <form id="wallet-form" class="form-grid">
      <label>
        Wallet address
        <input id="wallet-address" type="text" placeholder="0x..." required />
      </label>
      <div class="actions">
        <button type="submit" id="lookup-wallet">Check balance</button>
      </div>
    </form>
    <div id="wallet-result" class="wallet-result hidden">
      <div class="metric"><span>Address</span><strong id="wallet-address-result" class="mono">—</strong></div>
      <div class="metric"><span>Balance</span><strong id="wallet-balance">—</strong></div>
      <div class="metric"><span>Excluded from reflections</span><strong id="wallet-excluded">—</strong></div>
    </div>
  </section>

  <footer class="footer">
    <p>
      <a href="./install-android.html">Installer l’app Android (APK)</a>
      ·
      <a href="./privacy.html">Politique de confidentialité</a>
      ·
      <a href="https://carllaliberte.github.io/contract/privacy.html" target="_blank" rel="noreferrer">Privacy (web)</a>
    </p>
  </footer>
`

const rpcInput = document.querySelector<HTMLInputElement>('#rpc-url')!
const contractInput = document.querySelector<HTMLInputElement>('#contract-address')!
const walletInput = document.querySelector<HTMLInputElement>('#wallet-address')!
const statusEl = document.querySelector<HTMLParagraphElement>('#status')!
const walletStatusEl = document.querySelector<HTMLDivElement>('#wallet-status')!
const walletStatusMessageEl = document.querySelector<HTMLParagraphElement>('#wallet-status-message')!
const walletStatusActionsEl = document.querySelector<HTMLDivElement>('#wallet-status-actions')!
const walletResult = document.querySelector<HTMLDivElement>('#wallet-result')!
const walletBar = document.querySelector<HTMLDivElement>('#wallet-bar')!

rpcInput.value = getRpcUrl()
contractInput.value = getContractAddress()

function setStatus(message: string, type: 'info' | 'error' | 'success' = 'info') {
  statusEl.textContent = message
  statusEl.dataset.type = type
}

function setWalletStatus(
  message: string,
  type: 'info' | 'error' | 'success' = 'info',
  cta?: 'switch_chain' | 'reconnect',
  chainId?: number,
  connectorId?: 'metaMask' | 'coinbaseWalletSDK' | 'walletConnect',
) {
  walletStatusMessageEl.textContent = message
  walletStatusEl.dataset.type = type
  walletStatusEl.classList.remove('hidden')
  walletStatusActionsEl.innerHTML = ''
  walletStatusActionsEl.classList.add('hidden')

  if (cta === 'switch_chain' && chainId !== undefined) {
    const button = document.createElement('button')
    button.type = 'button'
    button.className = 'wallet-btn wallet-btn--secondary wallet-status__cta'
    button.textContent = 'Changer de réseau'
    button.addEventListener('click', () => {
      void handleWalletStatusCta(walletBar, 'switch_chain', chainId)
    })
    walletStatusActionsEl.append(button)
    walletStatusActionsEl.classList.remove('hidden')
    return
  }

  if (cta === 'reconnect' && connectorId) {
    const button = document.createElement('button')
    button.type = 'button'
    button.className = 'wallet-btn wallet-btn--primary wallet-status__cta'
    button.textContent = 'Reconnecter le portefeuille'
    button.addEventListener('click', () => {
      void handleWalletStatusCta(walletBar, 'reconnect', chainId, connectorId)
    })
    walletStatusActionsEl.append(button)
    walletStatusActionsEl.classList.remove('hidden')
  }
}

function setText(id: string, value: string) {
  const element = document.querySelector<HTMLElement>(`#${id}`)
  if (element) element.textContent = value
}

window.addEventListener('wallet-status', (event) => {
  const detail = (
    event as CustomEvent<{
      message: string
      type: 'info' | 'error' | 'success'
      cta?: 'switch_chain' | 'reconnect'
      chainId?: number
      connectorId?: 'metaMask' | 'coinbaseWalletSDK' | 'walletConnect'
    }>
  ).detail
  setWalletStatus(detail.message, detail.type, detail.cta, detail.chainId, detail.connectorId)
})

initWalletUi(walletBar, (address) => {
  if (address) {
    walletInput.value = address
  }
})

document.querySelector<HTMLFormElement>('#connection-form')!.addEventListener('submit', async (event) => {
  event.preventDefault()
  setStatus('Loading token data from the blockchain…')

  try {
    const snapshot = await fetchTokenSnapshot(contractInput.value.trim(), rpcInput.value.trim())
    setText('token-name', snapshot.name)
    setText('token-symbol', snapshot.symbol)
    setText('token-decimals', String(snapshot.decimals))
    setText('token-supply', snapshot.totalSupply)
    setText('token-fees', snapshot.totalFees)
    setText('token-owner', snapshot.owner)
    setText('token-max-tx', snapshot.maxTxAmount)
    setText('token-timeout', String(snapshot.transferTimeoutSeconds))
    setText('token-pair', snapshot.uniswapPair || 'Not set')
    setStatus(`Loaded ${snapshot.symbol} from ${snapshot.contractAddress}`, 'success')
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load token data'
    setStatus(message, 'error')
  }
})

document.querySelector<HTMLFormElement>('#wallet-form')!.addEventListener('submit', async (event) => {
  event.preventDefault()
  setStatus('Looking up wallet balance…')

  try {
    const snapshot = await fetchWalletSnapshot(
      walletInput.value.trim(),
      contractInput.value.trim(),
      rpcInput.value.trim(),
    )
    walletResult.classList.remove('hidden')
    setText('wallet-address-result', snapshot.address)
    setText('wallet-balance', snapshot.balance)
    setText('wallet-excluded', snapshot.isExcluded ? 'Yes' : 'No')
    setStatus(`Balance loaded for ${snapshot.address}`, 'success')
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load wallet data'
    setStatus(message, 'error')
  }
})

if (contractInput.value) {
  document.querySelector<HTMLFormElement>('#connection-form')!.requestSubmit()
}
