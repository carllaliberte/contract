import type { Address } from 'viem'
import { classifyWalletError } from '../lib/walletErrors'
import { getChainName, isSupportedChainId } from './chains'
import { getConnectedAccount, onAccountChange, shortenAddress, type WalletAccount } from './index'
import { fetchHeldAssets, getPortfolioChainLabel, type HeldAsset } from './portfolio'

function formatBalance(balance: string): string {
  const [whole, fraction = ''] = balance.split('.')
  if (!fraction) return whole

  const trimmedFraction = fraction.replace(/0+$/, '').slice(0, 6)
  return trimmedFraction ? `${whole}.${trimmedFraction}` : whole
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (ch) => {
    if (ch === '&') return '&' + 'amp;'
    if (ch === '<') return '&' + 'lt;'
    if (ch === '>') return '&' + 'gt;'
    if (ch === '"') return '&' + 'quot;'
    return '&#39;'
  })
}

function isWrongChain(account: WalletAccount): boolean {
  if (!account.isConnected || !account.address) return false
  return !isSupportedChainId(account.chainId)
}

function wrongChainMessage(chainId?: number): string {
  if (chainId !== undefined && !isSupportedChainId(chainId)) {
    return `Réseau non pris en charge : ${getChainName(chainId)} (chain ID ${chainId}).`
  }
  return classifyWalletError(new Error('wrong chain')).message
}

function renderLoading(portfolioPanel: HTMLElement) {
  portfolioPanel.innerHTML = `
    <p class="portfolio__status">Chargement des actifs…</p>
  `
}

function renderEmpty(portfolioPanel: HTMLElement, chainId: number) {
  portfolioPanel.innerHTML = `
    <p class="portfolio__status">
      Aucun actif avec un solde &gt; 0 sur ${escapeHtml(getPortfolioChainLabel(chainId))}.
    </p>
    <p class="portfolio__hint">Lecture seule — vos clés restent dans votre portefeuille.</p>
  `
}

function renderError(portfolioPanel: HTMLElement, message: string) {
  portfolioPanel.innerHTML = `
    <p class="portfolio__status portfolio__status--error">${escapeHtml(message)}</p>
  `
}

function renderDisconnected(portfolioPanel: HTMLElement) {
  portfolioPanel.innerHTML = `
    <p class="portfolio__status">Connectez un portefeuille pour afficher vos actifs.</p>
    <p class="portfolio__hint">Lecture seule, non-custodial — aucune transaction n’est envoyée.</p>
  `
}

function renderAssets(portfolioPanel: HTMLElement, account: WalletAccount, assets: HeldAsset[]) {
  const address = account.address ?? ''
  const chainId = account.chainId ?? 0

  portfolioPanel.innerHTML = `
    <div class="portfolio__header">
      <div>
        <p class="portfolio__label">Portefeuille connecté</p>
        <p class="portfolio__address mono" title="${escapeHtml(address)}">${escapeHtml(shortenAddress(address))}</p>
      </div>
      <p class="portfolio__chain">${escapeHtml(getPortfolioChainLabel(chainId))}</p>
    </div>
    <ul class="portfolio__list" aria-label="Mes actifs">
      ${assets
        .map(
          (asset) => `
            <li class="portfolio__item${asset.isMeta ? ' portfolio__item--meta' : ''}">
              <div class="portfolio__item-main">
                <strong class="portfolio__symbol">${escapeHtml(asset.symbol)}</strong>
                <span class="portfolio__name">${escapeHtml(asset.name)}</span>
              </div>
              <div class="portfolio__item-side">
                <strong class="portfolio__balance">${escapeHtml(formatBalance(asset.balance))}</strong>
                <span class="portfolio__kind">${asset.kind === 'native' ? 'Natif' : 'ERC-20'}</span>
              </div>
            </li>
          `,
        )
        .join('')}
    </ul>
    <p class="portfolio__hint">Lecture seule — vos clés restent dans votre portefeuille.</p>
  `
}

let loadGeneration = 0

async function loadPortfolio(portfolioPanel: HTMLElement, account: WalletAccount): Promise<void> {
  const generation = ++loadGeneration

  if (!account.isConnected || !account.address) {
    renderDisconnected(portfolioPanel)
    return
  }

  if (isWrongChain(account)) {
    renderError(portfolioPanel, wrongChainMessage(account.chainId))
    return
  }

  renderLoading(portfolioPanel)

  try {
    const assets = await fetchHeldAssets(account.address as Address, account.chainId!)
    if (generation !== loadGeneration) return

    if (assets.length === 0) {
      renderEmpty(portfolioPanel, account.chainId!)
      return
    }

    renderAssets(portfolioPanel, account, assets)
  } catch (error) {
    if (generation !== loadGeneration) return
    renderError(portfolioPanel, classifyWalletError(error, account.chainId).message)
  }
}

export function initPortfolioUi(
  portfolioPanel: HTMLElement,
  onStatus?: (message: string, type: 'info' | 'error' | 'success') => void,
): void {
  let wasConnected = getConnectedAccount().isConnected

  const refresh = (account: WalletAccount) => {
    void loadPortfolio(portfolioPanel, account)
  }

  refresh(getConnectedAccount())

  onAccountChange((account) => {
    if (wasConnected && account.status === 'disconnected') {
      onStatus?.(classifyWalletError(new Error('disconnected')).message, 'info')
    }

    wasConnected = account.isConnected
    refresh(account)

    if (account.isConnected && isWrongChain(account)) {
      onStatus?.(wrongChainMessage(account.chainId), 'error')
    }
  })
}
