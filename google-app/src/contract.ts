import { Contract, JsonRpcProvider, formatUnits, isAddress } from 'ethers'
import metaArtifact from './contracts/META.json'
import {
  metaEntitlements,
  resolveMetaTier,
  type MetaTier,
} from '../../shared/meta-entitlements'
import { getContractAddress, getRpcUrl } from './config'

export type { MetaTier }

export interface TokenSnapshot {
  name: string
  symbol: string
  decimals: number
  totalSupply: string
  totalFees: string
  owner: string
  maxTxAmount: string
  transferTimeoutSeconds: number
  uniswapPair: string
  contractAddress: string
  rpcUrl: string
}

export interface WalletSnapshot {
  address: string
  balance: string
  balanceWei: bigint
  symbol: string
  tier: MetaTier
  isExcluded: boolean
}

function requireAddress(address: string, label: string): string {
  if (!isAddress(address)) {
    throw new Error(`${label} must be a valid Ethereum address`)
  }
  return address
}

export function createMetaContract(contractAddress: string, rpcUrl: string): Contract {
  const address = requireAddress(contractAddress, 'Contract address')
  const provider = new JsonRpcProvider(rpcUrl)
  return new Contract(address, metaArtifact.abi, provider)
}

export async function fetchTokenSnapshot(
  contractAddress = getContractAddress(),
  rpcUrl = getRpcUrl(),
): Promise<TokenSnapshot> {
  if (!contractAddress) {
    throw new Error('Set a contract address in the form or VITE_CONTRACT_ADDRESS')
  }

  const contract = createMetaContract(contractAddress, rpcUrl)
  const [name, symbol, decimals, totalSupply, totalFees, owner, maxTxAmount, transferTimeout, uniswapPair] =
    await Promise.all([
      contract.name(),
      contract.symbol(),
      contract.decimals(),
      contract.totalSupply(),
      contract.totalFees(),
      contract.owner(),
      contract._maxTxAmount(),
      contract.transfertimeout(),
      contract.uniswapPair(),
    ])

  return {
    name,
    symbol,
    decimals: Number(decimals),
    totalSupply: formatUnits(totalSupply, decimals),
    totalFees: formatUnits(totalFees, decimals),
    owner,
    maxTxAmount: formatUnits(maxTxAmount, decimals),
    transferTimeoutSeconds: Number(transferTimeout),
    uniswapPair,
    contractAddress,
    rpcUrl,
  }
}

export async function fetchWalletSnapshot(
  walletAddress: string,
  contractAddress = getContractAddress(),
  rpcUrl = getRpcUrl(),
): Promise<WalletSnapshot> {
  if (!contractAddress) {
    throw new Error('Set a contract address in the form or VITE_CONTRACT_ADDRESS')
  }

  const address = requireAddress(walletAddress, 'Wallet address')
  const contract = createMetaContract(contractAddress, rpcUrl)
  const [balance, isExcluded, decimals, symbol] = await Promise.all([
    contract.balanceOf(address),
    contract.isExcluded(address),
    contract.decimals(),
    contract.symbol(),
  ])

  const balanceWei = BigInt(balance)

  return {
    address,
    balance: formatUnits(balance, decimals),
    balanceWei,
    symbol: symbol || metaEntitlements.symbol,
    tier: resolveMetaTier(balanceWei),
    isExcluded,
  }
}
