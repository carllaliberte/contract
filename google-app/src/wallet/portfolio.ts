import { createPublicClient, formatUnits, http, type Address } from 'viem'
import { sepolia } from 'viem/chains'
import { getRpcUrl } from '../config'
import { getChainById } from './chains'
import { getMetaTokenInfo, getTokensForChain } from './tokens'

const erc20BalanceOfAbi = [
  {
    type: 'function',
    name: 'balanceOf',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: 'balance', type: 'uint256' }],
  },
] as const

export interface HeldAsset {
  kind: 'native' | 'erc20'
  symbol: string
  name: string
  balance: string
  decimals: number
  address?: Address
  isMeta: boolean
}

function createClientForChain(chainId: number) {
  const chain = getChainById(chainId)
  if (!chain) {
    throw new Error(`Unsupported chain: ${chainId}`)
  }

  return createPublicClient({
    chain,
    transport: http(chainId === sepolia.id ? getRpcUrl() : undefined),
  })
}

export async function fetchHeldAssets(address: Address, chainId: number): Promise<HeldAsset[]> {
  const chain = getChainById(chainId)
  if (!chain) {
    throw new Error(`Unsupported chain: ${chainId}`)
  }

  const client = createClientForChain(chainId)
  const nativeSymbol = chain.nativeCurrency.symbol
  const nativeName = chain.nativeCurrency.name
  const nativeDecimals = chain.nativeCurrency.decimals

  const [nativeBalance, tokenBalances] = await Promise.all([
    client.getBalance({ address }),
    fetchTokenBalances(client, address, chainId),
  ])

  const assets: HeldAsset[] = []

  if (nativeBalance > 0n) {
    assets.push({
      kind: 'native',
      symbol: nativeSymbol,
      name: nativeName,
      balance: formatUnits(nativeBalance, nativeDecimals),
      decimals: nativeDecimals,
      isMeta: false,
    })
  }

  assets.push(...tokenBalances)

  return sortHeldAssets(assets)
}

async function fetchTokenBalances(
  client: ReturnType<typeof createPublicClient>,
  address: Address,
  chainId: number,
): Promise<HeldAsset[]> {
  const tokens = getTokensForChain(chainId)
  if (tokens.length === 0) return []

  const results = await client.multicall({
    contracts: tokens.map((token) => ({
      address: token.address,
      abi: erc20BalanceOfAbi,
      functionName: 'balanceOf',
      args: [address],
    })),
    allowFailure: true,
  })

  const metaAddress = getMetaTokenInfo()?.address.toLowerCase()
  const held: HeldAsset[] = []

  results.forEach((result, index) => {
    if (result.status !== 'success' || result.result === 0n) return

    const token = tokens[index]
    held.push({
      kind: 'erc20',
      symbol: token.symbol,
      name: token.name,
      balance: formatUnits(result.result, token.decimals),
      decimals: token.decimals,
      address: token.address,
      isMeta: token.address.toLowerCase() === metaAddress,
    })
  })

  return held
}

export function sortHeldAssets(assets: HeldAsset[]): HeldAsset[] {
  const metaAssets = assets.filter((asset) => asset.isMeta)
  const otherAssets = assets.filter((asset) => !asset.isMeta)

  otherAssets.sort((left, right) => {
    if (left.kind === 'native' && right.kind !== 'native') return -1
    if (right.kind === 'native' && left.kind !== 'native') return 1
    return left.symbol.localeCompare(right.symbol)
  })

  return [...metaAssets, ...otherAssets]
}

export function getPortfolioChainLabel(chainId: number): string {
  return getChainById(chainId)?.name ?? `Chain ${chainId}`
}
