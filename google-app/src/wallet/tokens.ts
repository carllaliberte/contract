import { isAddress } from 'viem'
import { mainnet, sepolia } from 'viem/chains'
import { getContractAddress } from '../config'

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

function dedupeTokens(tokens: TokenInfo[]): TokenInfo[] {
  const seen = new Set<string>()
  return tokens.filter((token) => {
    const key = token.address.toLowerCase()
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

export function getMetaTokenInfo(): TokenInfo | undefined {
  const address = getContractAddress()
  if (!address || !isAddress(address)) return undefined

  return {
    address,
    symbol: 'META',
    name: 'META',
    decimals: 9,
  }
}

export function getTokensForChain(chainId: number): TokenInfo[] {
  const baseTokens = chainId === mainnet.id ? MAINNET_TOKENS : chainId === sepolia.id ? SEPOLIA_TOKENS : []
  const metaToken = getMetaTokenInfo()
  return dedupeTokens(metaToken ? [metaToken, ...baseTokens] : baseTokens)
}
