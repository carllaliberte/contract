export const DEFAULT_RPC_URL = 'https://eth.llamarpc.com'

export const DEFAULT_CONTRACT_ADDRESS = ''

export function getRpcUrl(): string {
  return import.meta.env.VITE_RPC_URL?.trim() || DEFAULT_RPC_URL
}

export function getContractAddress(): string {
  return import.meta.env.VITE_CONTRACT_ADDRESS?.trim() || DEFAULT_CONTRACT_ADDRESS
}
