import { isAddress } from 'viem'
import { arbitrum, base, mainnet, polygon, sepolia } from 'viem/chains'
import { getContractAddress, getMetaChainId } from '../config'

export interface TokenInfo {
  address: `0x${string}`
  symbol: string
  name: string
  decimals: number
}

const MAINNET_TOKENS: TokenInfo[] = [
  {
    address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
    symbol: 'WETH',
    name: 'Wrapped Ether',
    decimals: 18,
  },
  {
    address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    symbol: 'USDC',
    name: 'USD Coin',
    decimals: 6,
  },
  {
    address: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
    symbol: 'USDT',
    name: 'Tether USD',
    decimals: 6,
  },
  {
    address: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
    symbol: 'DAI',
    name: 'Dai Stablecoin',
    decimals: 18,
  },
  {
    address: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599',
    symbol: 'WBTC',
    name: 'Wrapped BTC',
    decimals: 8,
  },
]

const SEPOLIA_TOKENS: TokenInfo[] = [
  {
    address: '0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14',
    symbol: 'WETH',
    name: 'Wrapped Ether',
    decimals: 18,
  },
  {
    address: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238',
    symbol: 'USDC',
    name: 'USD Coin',
    decimals: 6,
  },
  {
    address: '0x94a9D9AC8a22534E3FaCa9F4e7F2E2cf85d5E4C8',
    symbol: 'USDT',
    name: 'Tether USD',
    decimals: 6,
  },
]

const POLYGON_TOKENS: TokenInfo[] = [
  {
    address: '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270',
    symbol: 'WMATIC',
    name: 'Wrapped Matic',
    decimals: 18,
  },
  {
    address: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174',
    symbol: 'USDC',
    name: 'USD Coin',
    decimals: 6,
  },
]

const ARBITRUM_TOKENS: TokenInfo[] = [
  {
    address: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1',
    symbol: 'WETH',
    name: 'Wrapped Ether',
    decimals: 18,
  },
  {
    address: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
    symbol: 'USDC',
    name: 'USD Coin',
    decimals: 6,
  },
]

const BASE_TOKENS: TokenInfo[] = [
  {
    address: '0x4200000000000000000000000000000000000006',
    symbol: 'WETH',
    name: 'Wrapped Ether',
    decimals: 18,
  },
  {
    address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
    symbol: 'USDC',
    name: 'USD Coin',
    decimals: 6,
  },
]

const TOKENS_BY_CHAIN: Partial<Record<number, TokenInfo[]>> = {
  [mainnet.id]: MAINNET_TOKENS,
  [sepolia.id]: SEPOLIA_TOKENS,
  [polygon.id]: POLYGON_TOKENS,
  [arbitrum.id]: ARBITRUM_TOKENS,
  [base.id]: BASE_TOKENS,
}

function dedupeTokens(tokens: TokenInfo[]): TokenInfo[] {
  const seen = new Set<string>()
  return tokens.filter((token) => {
    const key = token.address.toLowerCase()
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

export function getMetaTokenInfo(chainId?: number): TokenInfo | undefined {
  const address = getContractAddress()
  if (!address || !isAddress(address)) return undefined

  const metaChainId = getMetaChainId()
  if (chainId !== undefined && chainId !== metaChainId) return undefined

  return {
    address,
    symbol: 'META',
    name: 'META',
    decimals: 9,
  }
}

export function getTokensForChain(chainId: number): TokenInfo[] {
  const baseTokens = TOKENS_BY_CHAIN[chainId] ?? []
  const metaToken = getMetaTokenInfo(chainId)
  return dedupeTokens(metaToken ? [metaToken, ...baseTokens] : baseTokens)
}
