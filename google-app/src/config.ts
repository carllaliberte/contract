export const DEFAULT_RPC_URL = 'https://rendering-parker-mesh-henderson.trycloudflare.com'

export const DEFAULT_CONTRACT_ADDRESS = '0x5FbDB2315678afecb367f032d93F642f64180aa3'

export function getRpcUrl(): string {
  return import.meta.env.VITE_RPC_URL?.trim() || DEFAULT_RPC_URL
}

export function getContractAddress(): string {
  return import.meta.env.VITE_CONTRACT_ADDRESS?.trim() || DEFAULT_CONTRACT_ADDRESS
}
