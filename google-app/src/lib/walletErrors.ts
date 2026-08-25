export type WalletErrorKind =
  | 'rejected'
  | 'disconnected'
  | 'wrong_chain'
  | 'insufficient_funds'
  | 'timeout'
  | 'unsupported'
  | 'unknown'

export type WalletErrorCta = 'switch_chain' | 'reconnect'

export interface ClassifiedWalletError {
  kind: WalletErrorKind
  message: string
  cta?: WalletErrorCta
  chainId?: number
}

const messages: Record<WalletErrorKind, string> = {
  rejected: 'Demande annulée dans le portefeuille.',
  disconnected: 'Portefeuille déconnecté. Reconnectez-vous pour continuer.',
  wrong_chain: 'Réseau incorrect. Changez de réseau dans le portefeuille.',
  insufficient_funds: 'Fonds insuffisants pour cette opération.',
  timeout: 'Délai dépassé. Réessayez dans un instant.',
  unsupported: 'Opération non prise en charge par ce portefeuille.',
  unknown: 'Une erreur est survenue. Réessayez.',
}

function getErrorName(error: unknown): string {
  if (typeof error === 'object' && error !== null && 'name' in error) {
    return String((error as { name: unknown }).name)
  }
  return ''
}

function getErrorCode(error: unknown): number | undefined {
  if (typeof error === 'object' && error !== null && 'code' in error) {
    const code = (error as { code: unknown }).code
    return typeof code === 'number' ? code : undefined
  }
  return undefined
}

function getErrorMessage(error: unknown): string {
  if (typeof error === 'object' && error !== null) {
    if ('shortMessage' in error && typeof (error as { shortMessage: unknown }).shortMessage === 'string') {
      return (error as { shortMessage: string }).shortMessage
    }
    if ('message' in error && typeof (error as { message: unknown }).message === 'string') {
      return (error as { message: string }).message
    }
  }
  if (typeof error === 'string') {
    return error
  }
  return ''
}

function walkErrors(error: unknown): unknown[] {
  const errors: unknown[] = []
  const seen = new Set<unknown>()
  let current: unknown = error

  while (current !== undefined && current !== null && !seen.has(current)) {
    seen.add(current)
    errors.push(current)

    if (typeof current === 'object' && 'cause' in current) {
      current = (current as { cause?: unknown }).cause
      continue
    }

    break
  }

  return errors
}

function matchesPattern(value: string, patterns: RegExp[]): boolean {
  const normalized = value.toLowerCase()
  return patterns.some((pattern) => pattern.test(normalized))
}

function classifyFromSignals(name: string, code: number | undefined, message: string): WalletErrorKind | null {
  if (
    name === 'UserRejectedRequestError' ||
    code === 4001 ||
    matchesPattern(message, [/user rejected/, /rejected the request/, /denied/, /cancelled/, /canceled/, /annul/])
  ) {
    return 'rejected'
  }

  if (
    name === 'ConnectorNotConnectedError' ||
    name === 'ProviderDisconnectedError' ||
    name === 'ChainDisconnectedError' ||
    code === 4900 ||
    code === 4901 ||
    matchesPattern(message, [/not connected/, /disconnected/, /déconnect/])
  ) {
    return 'disconnected'
  }

  if (
    name === 'SwitchChainError' ||
    name === 'ChainNotConfiguredError' ||
    code === 4902 ||
    matchesPattern(message, [/switch chain/, /wrong chain/, /unsupported chain/, /chain mismatch/, /network/, /réseau/])
  ) {
    return 'wrong_chain'
  }

  if (
    name === 'InsufficientFundsError' ||
    matchesPattern(message, [/insufficient funds/, /fonds insuffisants/])
  ) {
    return 'insufficient_funds'
  }

  if (matchesPattern(message, [/timeout/, /timed out/, /délai/])) {
    return 'timeout'
  }

  if (
    name === 'UnsupportedProviderMethodError' ||
    name === 'MethodNotSupportedRpcError' ||
    code === 4200 ||
    matchesPattern(message, [/not support/, /unsupported/, /non prise en charge/])
  ) {
    return 'unsupported'
  }

  return null
}

function buildClassified(kind: WalletErrorKind, chainId?: number): ClassifiedWalletError {
  const classified: ClassifiedWalletError = {
    kind,
    message: messages[kind],
  }

  if (kind === 'wrong_chain') {
    classified.cta = 'switch_chain'
    if (chainId !== undefined) {
      classified.chainId = chainId
    }
  }

  if (kind === 'disconnected') {
    classified.cta = 'reconnect'
  }

  return classified
}

export function classifyWalletError(error: unknown, chainId?: number): ClassifiedWalletError {
  for (const entry of walkErrors(error)) {
    const kind = classifyFromSignals(getErrorName(entry), getErrorCode(entry), getErrorMessage(entry))
    if (kind) {
      return buildClassified(kind, chainId)
    }
  }

  return buildClassified('unknown', chainId)
}

export class WalletError extends Error {
  readonly classified: ClassifiedWalletError

  constructor(classified: ClassifiedWalletError) {
    super(classified.message)
    this.name = 'WalletError'
    this.classified = classified
  }
}

export function toWalletError(error: unknown, chainId?: number): WalletError {
  if (error instanceof WalletError) {
    return error
  }

  return new WalletError(classifyWalletError(error, chainId))
}
