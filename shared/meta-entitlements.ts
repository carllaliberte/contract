import config from './meta-entitlements.json'

export type MetaTier = 'free' | 'holder' | 'pro-onchain'

export interface MetaEntitlementsConfig {
  contractAddress: string
  chainId: number
  symbol: string
  displayName?: string
  decimals: number
  thresholds: {
    holder: string
    proOnchain: string
  }
  creatorflow: {
    holderBonusAiPerMonth: number
  }
  disclaimer: {
    en: string
    fr: string
  }
}

export const metaEntitlements = config as MetaEntitlementsConfig

export function thresholdToWei(
  amount: string,
  decimals: number = metaEntitlements.decimals,
): bigint {
  const trimmed = amount.trim()
  if (!/^\d+(\.\d+)?$/.test(trimmed)) {
    throw new Error(`Invalid threshold amount: ${amount}`)
  }
  const [whole, fraction = ''] = trimmed.split('.')
  const fractionPadded = fraction.padEnd(decimals, '0').slice(0, decimals)
  return BigInt(`${whole}${fractionPadded}`)
}

export const holderThresholdWei = thresholdToWei(metaEntitlements.thresholds.holder)
export const proOnchainThresholdWei = thresholdToWei(metaEntitlements.thresholds.proOnchain)

export function resolveMetaTier(balanceWei: bigint): MetaTier {
  if (balanceWei >= proOnchainThresholdWei) return 'pro-onchain'
  if (balanceWei >= holderThresholdWei) return 'holder'
  return 'free'
}

export function tierLabel(tier: MetaTier): string {
  switch (tier) {
    case 'pro-onchain':
      return 'Pro (on-chain)'
    case 'holder':
      return 'Holder'
    default:
      return 'Free'
  }
}

export function tierDescription(tier: MetaTier): string {
  const name = metaEntitlements.displayName ?? metaEntitlements.symbol
  switch (tier) {
    case 'pro-onchain':
      return `≥ ${metaEntitlements.thresholds.proOnchain} ${name} — highest on-chain access tier`
    case 'holder':
      return `≥ ${metaEntitlements.thresholds.holder} ${name} — holder benefits in the ecosystem`
    default:
      return `Below ${metaEntitlements.thresholds.holder} ${name} — standard access`
  }
}
