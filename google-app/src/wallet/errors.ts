import { SwitchChainError, UserRejectedRequestError } from 'viem'
import { getChainById } from './chains'
import type { WalletAccount } from './index'

export type WalletErrorKind = 'rejected' | 'wrong_chain' | 'disconnected' | 'unknown'

export interface WalletErrorInfo {
  kind: WalletErrorKind
  message: string
}

export function isWrongChain(account: WalletAccount): boolean {
  if (!account.isConnected || !account.address) return false
  if (account.chainId === undefined) return true
  return !getChainById(account.chainId)
}

export function parseWalletError(error: unknown): WalletErrorInfo {
  if (error instanceof UserRejectedRequestError) {
    return {
      kind: 'rejected',
      message: 'Connexion refusée dans le portefeuille.',
    }
  }

  if (error instanceof SwitchChainError) {
    return {
      kind: 'wrong_chain',
      message: 'Réseau non pris en charge. Choisissez Sepolia ou Ethereum mainnet.',
    }
  }

  if (error instanceof Error) {
    const normalized = error.message.toLowerCase()

    if (
      normalized.includes('user rejected') ||
      normalized.includes('user denied') ||
      normalized.includes('rejected the request')
    ) {
      return { kind: 'rejected', message: 'Connexion refusée dans le portefeuille.' }
    }

    if (
      normalized.includes('unsupported chain') ||
      normalized.includes('chain not configured') ||
      normalized.includes('switch chain')
    ) {
      return {
        kind: 'wrong_chain',
        message: 'Réseau non pris en charge. Choisissez Sepolia ou Ethereum mainnet.',
      }
    }

    if (normalized.includes('disconnected')) {
      return { kind: 'disconnected', message: 'Portefeuille déconnecté.' }
    }

    return { kind: 'unknown', message: error.message }
  }

  return { kind: 'unknown', message: 'Une erreur inattendue est survenue.' }
}

export function disconnectedMessage(): WalletErrorInfo {
  return { kind: 'disconnected', message: 'Portefeuille déconnecté.' }
}

export function wrongChainMessage(chainId?: number): WalletErrorInfo {
  const suffix = chainId ? ` (chainId ${chainId})` : ''
  return {
    kind: 'wrong_chain',
    message: `Réseau non pris en charge${suffix}. Basculez vers Sepolia ou Ethereum mainnet.`,
  }
}
